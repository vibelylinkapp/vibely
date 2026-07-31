import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { effectiveTier, BOOST_QUOTA } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOST_MINUTES = 30;
const WINDOW_DAYS = 30;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  const ent = effectiveTier(sub);
  const quota = BOOST_QUOTA[ent.tier] ?? 0;

  if (quota === 0) {
    return NextResponse.json({ ok: false, reason: "not_eligible" }, { status: 403 });
  }

  const now = Date.now();

  // Don't stack: if a boost is already active, just report it.
  const { data: active } = await supabase
    .from("boosts")
    .select("expires_at")
    .eq("profile_id", user.id)
    .gt("expires_at", new Date(now).toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) {
    return NextResponse.json({
      ok: true,
      activeUntil: active.expires_at,
      remaining: null,
      alreadyActive: true,
    });
  }

  // Enforce the monthly quota (null quota = unlimited, e.g. VIP).
  let remaining: number | null = null;
  if (quota !== null) {
    const since = new Date(now - WINDOW_DAYS * 86400000).toISOString();
    const { count } = await supabase
      .from("boosts")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .gte("created_at", since);
    const used = count ?? 0;
    if (used >= quota) {
      return NextResponse.json(
        { ok: false, reason: "quota_exceeded" },
        { status: 429 }
      );
    }
    remaining = quota - used - 1;
  }

  const expiresAt = new Date(now + BOOST_MINUTES * 60000).toISOString();
  const { error } = await supabase
    .from("boosts")
    .insert({ profile_id: user.id, expires_at: expiresAt });
  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, activeUntil: expiresAt, remaining });
}
