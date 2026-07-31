import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_DAYS } from "@/lib/tiers";
import type { Json } from "@/lib/database.types";

// Safaricom calls this endpoint (no user session). Must be public + https.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallbackItem = { Name: string; Value?: string | number };

export async function POST(req: Request) {
  // Optional shared-secret gate. When MPESA_CALLBACK_SECRET is set, the STK
  // push registers a callback URL carrying ?t=<secret>; reject anything that
  // doesn't present it, so a stranger who happens to know a pending checkout
  // id can't POST a fake "success" and self-activate a subscription. Skipped
  // entirely when unset, so it never breaks an existing deployment.
  const expected = process.env.MPESA_CALLBACK_SECRET;
  if (expected) {
    const token = new URL(req.url).searchParams.get("t");
    if (token !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const payload = raw as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        CallbackMetadata?: { Item?: CallbackItem[] };
      };
    };
  };
  const cb = payload?.Body?.stkCallback;
  if (cb?.CheckoutRequestID) {
    const admin = createAdminClient();
    const checkoutId = cb.CheckoutRequestID;

    const { data: pay } = await admin
      .from("payments")
      .select("id, profile_id, tier, status")
      .eq("mpesa_checkout_id", checkoutId)
      .maybeSingle();

    // Ignore if unknown or already resolved (callbacks can be retried).
    if (pay && pay.status === "pending") {
      if (cb.ResultCode === 0) {
        const items = cb.CallbackMetadata?.Item ?? [];
        const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")
          ?.Value;
        await admin
          .from("payments")
          .update({
            status: "success",
            mpesa_receipt: receipt != null ? String(receipt) : null,
            raw_callback: payload,
          })
          .eq("id", pay.id);

        if (pay.profile_id && pay.tier) {
          const now = new Date();
          const end = new Date(
            now.getTime() + SUBSCRIPTION_DAYS * 86400000
          );
          await admin
            .from("subscriptions")
            .update({
              tier: pay.tier,
              status: "active",
              started_at: now.toISOString(),
              expires_at: end.toISOString(),
            })
            .eq("profile_id", pay.profile_id);
        }
      } else {
        await admin
          .from("payments")
          .update({ status: "failed", raw_callback: payload })
          .eq("id", pay.id);
      }
    }
  }

  // Always acknowledge so Safaricom stops retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
