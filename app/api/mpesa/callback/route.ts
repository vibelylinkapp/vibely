import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_DAYS } from "@/lib/tiers";
import type { Json } from "@/lib/database.types";

// Safaricom calls this endpoint (no user session). Must be public + https.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallbackItem = { Name: string; Value?: string | number };

// True when the request presents the shared secret that the STK push embedded
// in the callback URL as ?t=<secret>. Both push routes (mpesa/stkpush and
// events/stkpush) append it, so a genuine Safaricom callback always carries
// it; anything else is refused. Without this gate, a stranger who learns a
// pending checkout id could POST a fake ResultCode 0 and self-activate a paid
// tier or an event booking.
//
// This FAILS CLOSED. The check used to be wrapped in `if (expected)`, so an
// unset or mistyped MPESA_CALLBACK_SECRET silently disabled it entirely
// rather than refusing traffic. That is the dangerous direction for a payment
// webhook and it is indistinguishable from working correctly -- the endpoint
// returns exactly the same 200s either way. Same posture as the authorized()
// helper in /api/cron/winback.
//
// Operational note: because this now refuses traffic when unconfigured,
// MPESA_CALLBACK_SECRET must be present in every environment that takes
// payments, Preview included, and must be rotated on both sides at once.
function authorized(req: Request): boolean {
  const expected = process.env.MPESA_CALLBACK_SECRET;
  if (!expected) return false;
  return new URL(req.url).searchParams.get("t") === expected;
}

export async function POST(req: Request) {
  // Required shared-secret gate -- see authorized() above.
  if (!authorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
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
      .select("id, profile_id, tier, status, event_id")
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

        // Event ticket: the seat was held as pending_payment by
        // /api/events/stkpush. Safaricom has now confirmed, so the ticket
        // becomes real. This is the only path that can confirm a paid
        // booking -- the browser is blocked from doing it by RLS.
        if (pay.profile_id && pay.event_id) {
          await admin
            .from("event_bookings")
            .update({ status: "confirmed", payment_id: pay.id })
            .eq("event_id", pay.event_id)
            .eq("profile_id", pay.profile_id);
        }
      } else {
        await admin
          .from("payments")
          .update({ status: "failed", raw_callback: payload })
          .eq("id", pay.id);

        // Payment failed or was cancelled: release the held seat so the
        // event does not silently fill up with unpaid holds.
        if (pay.profile_id && pay.event_id) {
          await admin
            .from("event_bookings")
            .delete()
            .eq("event_id", pay.event_id)
            .eq("profile_id", pay.profile_id)
            .eq("status", "pending_payment");
        }
      }
    }
  }

  // Always acknowledge so Safaricom stops retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
