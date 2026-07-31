import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// web-push needs Node APIs — never run on the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const WINDOW_DAYS = 7; // nudge members who lapsed within the last week
const KIND = "winback";
const TIER_LABEL: Record<string, string> = {
  plus: "Plus",
  gold: "Gold",
  vip: "VIP",
};

// True when the request carries Vercel Cron's Authorization: Bearer <CRON_SECRET>.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  const db = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const sinceIso = new Date(now - WINDOW_DAYS * DAY_MS).toISOString();

  // Paid members who lapsed within the last week (expired, not renewed).
  const { data: lapsed } = await db
    .from("subscriptions")
    .select("profile_id, tier, expires_at")
    .neq("tier", "free")
    .lt("expires_at", nowIso)
    .gte("expires_at", sinceIso);

  const rows = lapsed ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, nudged: 0 });
  }

  const profileIds = Array.from(new Set(rows.map((r) => r.profile_id)));

  // Members already nudged for this specific lapse (ref = the lapse's expires_at).
  const { data: priorNudges } = await db
    .from("nudges")
    .select("profile_id, ref")
    .eq("kind", KIND)
    .in("profile_id", profileIds);
  const alreadyNudged = new Set(
    (priorNudges ?? []).map((n) => `${n.profile_id}:${n.ref ?? ""}`)
  );

  // Registered devices for these members.
  const { data: pushSubs } = await db
    .from("push_subscriptions")
    .select("id, subscription, profile_id")
    .in("profile_id", profileIds);
  const subsByProfile: Record<
    string,
    { id: string; subscription: unknown }[]
  > = {};
  (pushSubs ?? []).forEach((row) => {
    (subsByProfile[row.profile_id] ??= []).push({
      id: row.id,
      subscription: row.subscription,
    });
  });

  webpush.setVapidDetails("mailto:hello@vibely.link", pub, priv);

  let nudged = 0;
  const stale: string[] = [];
  const toRecord: { profile_id: string; kind: string; ref: string }[] = [];
  const seen = new Set<string>();

  for (const c of rows) {
    const exp = c.expires_at;
    if (!exp) continue;
    const key = `${c.profile_id}:${exp}`;
    if (seen.has(key)) continue; // a member appears once per lapse row
    seen.add(key);
    if (alreadyNudged.has(key)) continue;

    const targets = subsByProfile[c.profile_id];
    if (!targets || targets.length === 0) continue; // no device — retry a later day

    const label = TIER_LABEL[c.tier] ?? "membership";
    const payload = JSON.stringify({
      title: "We miss you at Vibely",
      body: `Your ${label} perks are one tap away. Reactivate and pick up where you left off.`,
      url: "/upgrade",
      tag: "winback",
    });

    let delivered = false;
    await Promise.all(
      targets.map(async (t) => {
        try {
          await webpush.sendNotification(
            t.subscription as webpush.PushSubscription,
            payload
          );
          delivered = true;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) stale.push(t.id);
        }
      })
    );

    // Only record the nudge once it actually reached a device, so a member
    // with no device now can still be caught after they enable notifications.
    if (delivered) {
      nudged += 1;
      toRecord.push({ profile_id: c.profile_id, kind: KIND, ref: exp });
    }
  }

  if (stale.length > 0) {
    await db.from("push_subscriptions").delete().in("id", stale);
  }
  if (toRecord.length > 0) {
    await db
      .from("nudges")
      .upsert(toRecord, {
        onConflict: "profile_id,kind,ref",
        ignoreDuplicates: true,
      });
  }

  return NextResponse.json({ ok: true, nudged });
}
