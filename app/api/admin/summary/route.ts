import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeAdminSummary,
  summaryHeadline,
  type AdminSummary,
} from "@/lib/admin/summary";

// web-push needs Node APIs — never run on the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// True when the request carries Vercel Cron's Authorization: Bearer <CRON_SECRET>.
function isCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function isAdminSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !!profile?.is_admin;
}

// Push the digest headline to every admin's registered devices.
async function pushToAdmins(summary: AdminSummary): Promise<number> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return 0;

  const db = createAdminClient();
  const { data: admins } = await db
    .from("profiles")
    .select("id")
    .eq("is_admin", true);
  const adminIds = (admins ?? []).map((a) => a.id);
  if (adminIds.length === 0) return 0;

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .in("profile_id", adminIds);
  if (!subs || subs.length === 0) return 0;

  webpush.setVapidDetails("mailto:hello@vibely.link", pub, priv);
  const payload = JSON.stringify({
    title: "Vibely admin summary",
    body: summaryHeadline(summary),
    url: "/admin",
    tag: "admin-summary",
  });

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (row: { id: string; subscription: unknown }) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(row.id);
      }
    })
  );
  if (stale.length > 0) {
    await db.from("push_subscriptions").delete().in("id", stale);
  }
  return sent;
}

async function handle(req: Request, forceSend: boolean) {
  const cron = isCron(req);
  if (!cron && !(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const summary = await computeAdminSummary();

  const url = new URL(req.url);
  const wantsSend = cron || forceSend || url.searchParams.get("send") === "1";
  const sent = wantsSend ? await pushToAdmins(summary) : 0;

  return NextResponse.json({ ok: true, summary, sent, delivered: wantsSend });
}

export async function GET(req: Request) {
  return handle(req, false);
}

export async function POST(req: Request) {
  return handle(req, true);
}
