import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stkPush, normalizeKePhone, mpesaConfigured } from "@/lib/mpesa";
import { TIER_PRICES, type PaidTier } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!mpesaConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "not_configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { tier?: string; phone?: string };
  try {
    body = (await req.json()) as { tier?: string; phone?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const tier = body.tier as PaidTier;
  if (!tier || !(tier in TIER_PRICES)) {
    return NextResponse.json({ ok: false, reason: "bad_tier" }, { status: 400 });
  }
  const phone = normalizeKePhone(body.phone || "");
  if (!phone) {
    return NextResponse.json({ ok: false, reason: "bad_phone" }, { status: 400 });
  }

  const amount = TIER_PRICES[tier];
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ||
    `${new URL(req.url).origin}/api/mpesa/callback`;

  try {
    const res = await stkPush({
      phone,
      amount,
      accountRef: "Vibely",
      description: `Vibely ${tier}`,
      callbackUrl,
    });

    // Record a pending payment (service role bypasses RLS).
    const admin = createAdminClient();
    await admin.from("payments").insert({
      profile_id: user.id,
      provider: "mpesa",
      amount_kes: amount,
      tier,
      mpesa_checkout_id: res.checkoutRequestId,
      phone,
      status: "pending",
    });

    return NextResponse.json({
      ok: true,
      checkoutId: res.checkoutRequestId,
      message: res.customerMessage,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: e instanceof Error ? e.message : "stk_failed" },
      { status: 502 }
    );
  }
}
