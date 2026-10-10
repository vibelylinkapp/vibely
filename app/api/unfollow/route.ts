import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asUuid } from "@/lib/security/sanitize";
import { logServerError } from "@/lib/security/request";

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
    targetId = asUuid(body.targetId) ?? "";
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
    logServerError("api/unfollow", error);
    return NextResponse.json(
      { ok: false, reason: "server_error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, following: false });
}
