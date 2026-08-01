import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Records a "pass" (left swipe) in the Nearby swipe deck so the person is not
// shown to this member again. No quota — passing is unlimited. RLS ensures a
// member can only insert their own passes.
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
    .from("passes")
    .insert({ passer_id: user.id, passed_id: targetId });
  // A duplicate (already passed) is fine — treat as success.
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
