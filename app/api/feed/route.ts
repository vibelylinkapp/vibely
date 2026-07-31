import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeedPage } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cursor-paged feed for infinite scroll. Runs on the caller's session so RLS +
// block/hide filtering apply exactly as on the home render.
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const cursor = new URL(req.url).searchParams.get("cursor");
  const { items, nextCursor } = await getFeedPage(supabase, user.id, {
    cursor,
  });
  return NextResponse.json({ ok: true, items, nextCursor });
}
