import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_DAYS } from "@/lib/tiers";

// Safaricom calls this endpoint (no user session). Must be public + https.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallbackItem = { Name: string; Value?: string | number };

export async function POST(req: Request) {
  let payload: {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        CallbackMetadata?: { Item?: CallbackItem[] };
      };
    };
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

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
