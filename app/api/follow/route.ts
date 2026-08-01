import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Follow a member (one-directional; separate from likes/matches). Idempotent.
// A block in either direction prevents a follow. Owner-only insert is enforced
// by the follows_insert_own RLS policy.
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

  // No following across a block, in either direction.
  const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetId)
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", targetId)
      .eq("blocked_id", user.id)
      .maybeSingle(),
  ]);
  if (iBlocked || blockedMe) {
    return NextResponse.json({ ok: false, reason: "blocked" }, { status: 403 });
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetId });
  // A duplicate (already following) is fine — treat as success.
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, following: true });
}
