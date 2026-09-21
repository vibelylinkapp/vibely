"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normaliseKeNumber } from "@/lib/phone";
import { createSubaccount, paystackConfigured } from "@/lib/paystack";
import { DEFAULT_COMMISSION_PCT } from "@/lib/commission";

export type PayoutResult = {
  ok: boolean;
  message: string;
  status?: string;
};

/**
 * Register (or re-register) the host's M-Pesa number as a Paystack
 * subaccount, so ticket money for their events settles to them directly
 * instead of landing in the platform till.
 *
 * Paystack's own error message is surfaced verbatim on failure -- it tells
 * us far more about what it accepts as a Kenyan payout account than any
 * message we could invent.
 */
export async function savePayoutNumber(raw: string): Promise<PayoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const normalised = normaliseKeNumber(raw);
  if (!normalised) {
    return {
      ok: false,
      message: "That does not look like a Kenyan number. Use 07xx xxx xxx.",
    };
  }

  if (!paystackConfigured()) {
    return {
      ok: false,
      message: "Payouts are not configured on this site yet.",
    };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const res = await createSubaccount({
    businessName: profile?.display_name || "Vibely host",
    mpesaNumber: normalised,
    // Paystack requires this, and reads it as the platform's cut.
    platformPct: DEFAULT_COMMISSION_PCT,
  });

  if (!res.ok || !res.data?.subaccount_code) {
    await admin.from("host_payouts").upsert(
      {
        profile_id: user.id,
        mpesa_number: normalised,
        status: "failed",
        last_error: res.message,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
    return { ok: false, message: res.message, status: "failed" };
  }

  await admin.from("host_payouts").upsert(
    {
      profile_id: user.id,
      mpesa_number: normalised,
      settlement_bank: "MPESA",
      paystack_subaccount_code: res.data.subaccount_code,
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );

  // Echo back the figure Paystack actually stored rather than the one we
  // sent. If the percentage_charge semantics are inverted from what the
  // API reference states, this is where it becomes visible -- before any
  // real ticket money moves.
  const storedPct = res.data.percentage_charge;
  const pctNote =
    typeof storedPct === "number"
      ? ` Paystack recorded a ${storedPct}% platform commission, so you keep ${
          100 - storedPct
        }%.`
      : "";

  return {
    ok: true,
    message: `Payouts are set up. Ticket money will come straight to you.${pctNote}`,
    status: "active",
  };
}
