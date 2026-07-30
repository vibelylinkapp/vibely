import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const checkoutId = new URL(req.url).searchParams.get("checkoutId");
  if (!checkoutId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pay } = await admin
    .from("payments")
    .select("status, tier, profile_id")
    .eq("mpesa_checkout_id", checkoutId)
    .maybeSingle();

  // Only expose the caller's own payment.
  if (!pay || pay.profile_id !== user.id) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: pay.status, tier: pay.tier });
}
