import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unfollow a member. Owner-only delete is enforced by the follows_delete_own
// RLS policy.
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

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, following: false });
}
