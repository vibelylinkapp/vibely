import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Removes a like — used by the swipe-deck rewind/undo. Deleting the row also
// refunds the free daily quota automatically, since the quota is a count of
// today's likes (see /api/like). A like that formed a match is never offered
// for rewind on the client, so this only ever removes non-matching likes.
// Owner-only delete is enforced by the likes_delete_own RLS policy.
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
    .from("likes")
    .delete()
    .eq("liker_id", user.id)
    .eq("liked_id", targetId);
  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
