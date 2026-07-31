import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Web Push needs Node APIs — never run on the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  toUserId?: string;
  kind?: "message" | "match" | "post_like" | "post_comment";
  conversationId?: string;
  postId?: string;
};

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

const UUIDISH = /^[0-9a-f-]{16,}$/i;

type Payload = { title: string; body: string; url: string; tag: string };

export async function POST(req: Request) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pub || !priv || !svc) {
    // Not configured yet — succeed quietly so senders never break.
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  // Identify the sender from their session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind =
    body.kind === "match" ||
    body.kind === "post_like" ||
    body.kind === "post_comment"
      ? body.kind
      : "message";
  const isPost = kind === "post_like" || kind === "post_comment";

  const db = admin();

  // Sender's display name for the notification body (shared by every kind).
  const { data: me } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = me?.display_name || "Someone";

  // Resolve the recipient and the notification payload per kind.
  let toUserId: string | null = null;
  let payload: Payload;

  if (isPost) {
    // Derive the recipient from the post itself — never trust a
    // client-supplied target for post notifications.
    const postId =
      typeof body.postId === "string" && UUIDISH.test(body.postId)
        ? body.postId
        : null;
    if (!postId) return NextResponse.json({ ok: false, reason: "no_post" });

    const { data: post } = await db
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();
    if (!post) return NextResponse.json({ ok: false, reason: "no_post" });

    toUserId = post.author_id;
    // Don't notify yourself about your own like/comment.
    if (toUserId === user.id) {
      return NextResponse.json({ ok: false, reason: "self" });
    }

    payload =
      kind === "post_like"
        ? {
            title: `${name} liked your post`,
            body: "Tap to see it on Vibely.",
            url: `/posts/${postId}`,
            tag: `post-like-${postId}`,
          }
        : {
            title: `${name} commented on your post`,
            body: "Tap to read the comment.",
            url: `/posts/${postId}`,
            tag: `post-comment-${postId}`,
          };
  } else {
    const target = body.toUserId;
    if (!target || target === user.id) {
      return NextResponse.json({ ok: false, reason: "no_target" });
    }

    // Match-gate: only deliver if sender and recipient mutually liked each
    // other. Check the likes table directly (service role).
    const { data: likeRows } = await db
      .from("likes")
      .select("liker_id, liked_id")
      .or(
        `and(liker_id.eq.${user.id},liked_id.eq.${target}),and(liker_id.eq.${target},liked_id.eq.${user.id})`
      );
    const rows = likeRows ?? [];
    const mutual =
      rows.some((r) => r.liker_id === user.id && r.liked_id === target) &&
      rows.some((r) => r.liker_id === target && r.liked_id === user.id);
    if (!mutual) {
      return NextResponse.json({ ok: false, reason: "not_matched" });
    }
    toUserId = target;

    // Only accept a plausible conversation id (uuid-ish) for the deep link.
    const conversationId =
      typeof body.conversationId === "string" &&
      UUIDISH.test(body.conversationId)
        ? body.conversationId
        : null;

    payload =
      kind === "match"
        ? {
            title: "It's a match on Vibely",
            body: `You and ${name} liked each other. Say hi!`,
            url: "/matches",
            tag: `match-${user.id}`,
          }
        : {
            title: `New message from ${name}`,
            body: "Tap to open the conversation.",
            url: conversationId ? `/messages/${conversationId}` : "/messages",
            tag: `msg-${user.id}`,
          };
  }

  webpush.setVapidDetails("mailto:hello@vibely.link", pub, priv);

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("profile_id", toUserId);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (row: { id: string; subscription: unknown }) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(row.id);
      }
    })
  );

  if (stale.length > 0) {
    await db.from("push_subscriptions").delete().in("id", stale);
  }

  return NextResponse.json({ ok: true, sent });
}
