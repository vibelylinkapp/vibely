import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { effectiveTier, FREE_DAILY_LIKE_LIMIT } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kenya/East Africa time (EAT, UTC+3, no DST). The free daily like quota
// resets at local midnight, so we count likes since the start of today in EAT.
const EAT_OFFSET = 3 * 3600000;

function startOfEatDayIso(now: number): string {
  const eatMidnight = Math.floor((now + EAT_OFFSET) / 86400000) * 86400000;
  return new Date(eatMidnight - EAT_OFFSET).toISOString();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let targetId = "";
  try {
    const body = (await req.json()) as { targetId?: string };
    targetId = body.targetId ?? "";
  } catch {
    targetId = "";
  }
  if (!targetId || targetId === user.id) {
    return NextResponse.json(
      { ok: false, reason: "bad_target" },
      { status: 400 }
    );
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  const ent = effectiveTier(sub);

  // Idempotent: an existing like is never re-counted against the daily quota.
  const { data: existing } = await supabase
    .from("likes")
    .select("liker_id")
    .eq("liker_id", user.id)
    .eq("liked_id", targetId)
    .maybeSingle();

  let remaining: number | null = null;

  if (!existing) {
    // Free members get a daily cap; paid tiers (Plus and up) are unlimited.
    if (!ent.isPaid) {
      const since = startOfEatDayIso(Date.now());
      const { count } = await supabase
        .from("likes")
        .select("liked_id", { count: "exact", head: true })
        .eq("liker_id", user.id)
        .gte("created_at", since);
      const used = count ?? 0;
      if (used >= FREE_DAILY_LIKE_LIMIT) {
        return NextResponse.json(
          { ok: false, reason: "daily_limit", limit: FREE_DAILY_LIKE_LIMIT },
          { status: 429 }
        );
      }
      remaining = FREE_DAILY_LIKE_LIMIT - used - 1;
    }

    const { error } = await supabase
      .from("likes")
      .insert({ liker_id: user.id, liked_id: targetId });
    // A duplicate row (race with another tab) is fine — treat as already liked.
    if (error && !/duplicate key/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, reason: error.message },
        { status: 500 }
      );
    }
  } else if (!ent.isPaid) {
    const since = startOfEatDayIso(Date.now());
    const { count } = await supabase
      .from("likes")
      .select("liked_id", { count: "exact", head: true })
      .eq("liker_id", user.id)
      .gte("created_at", since);
    remaining = Math.max(0, FREE_DAILY_LIKE_LIMIT - (count ?? 0));
  }

  // Did the target already like me back? -> it's a match.
  const { data: back } = await supabase
    .from("likes")
    .select("liker_id")
    .eq("liker_id", targetId)
    .eq("liked_id", user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, matched: !!back, remaining });
}
