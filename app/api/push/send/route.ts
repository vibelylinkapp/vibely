import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Web Push needs Node APIs — never run on the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { toUserId?: string; kind?: "message" | "match" };

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

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
  const toUserId = body.toUserId;
  const kind = body.kind === "match" ? "match" : "message";
  if (!toUserId || toUserId === user.id) {
    return NextResponse.json({ ok: false, reason: "no_target" });
  }

  const db = admin();

  // Match-gate: only deliver if sender and recipient are a mutual match.
  const { data: matched } = await db
    .from("matches")
    .select("a")
    .or(
      `and(a.eq.${user.id},b.eq.${toUserId}),and(a.eq.${toUserId},b.eq.${user.id})`
    )
    .limit(1);
  if (!matched || matched.length === 0) {
    return NextResponse.json({ ok: false, reason: "not_matched" });
  }

  // Sender's display name for the notification body.
  const { data: me } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = me?.display_name || "Someone";

  const payload =
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
          url: "/messages",
          tag: `msg-${user.id}`,
        };

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
