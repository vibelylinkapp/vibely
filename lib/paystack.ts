// Paystack REST helpers. Server-only: PAYSTACK_SECRET_KEY must never be
// exposed to the browser, so nothing here may be imported into a client
// component.

const BASE = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function paystackIsTestMode(): boolean {
  return (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_test_");
}

function key(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return k;
}

type PaystackResponse<T> = {
  status: boolean;
  message?: string;
  data?: T;
};

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; message: string; data?: T }> {
  const r = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  let j: PaystackResponse<T> | null = null;
  try {
    j = (await r.json()) as PaystackResponse<T>;
  } catch {
    /* non-JSON error body */
  }
  return {
    // Paystack signals success in the body, not only the status code.
    ok: r.ok && Boolean(j?.status),
    // Surface Paystack's own message verbatim: it is far more useful than
    // anything we could invent, especially while we are still learning
    // what it accepts as a Kenyan M-Pesa payout account.
    message: j?.message ?? `HTTP ${r.status}`,
    data: j?.data,
  };
}

/**
 * M-Pesa payout accounts are phone numbers. We store numbers normalised to
 * 254XXXXXXXXX, but Paystack's account_number field is more commonly the
 * local 0XXXXXXXXX form, so convert on the way out.
 */
export function toLocalKePhone(normalised: string): string {
  const digits = normalised.replace(/[^0-9]/g, "");
  if (digits.startsWith("254") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

export type Subaccount = {
  subaccount_code: string;
  business_name?: string;
  settlement_bank?: string;
  account_number?: string;
  percentage_charge?: number;
};

/**
 * Create a subaccount that settles to a host's M-Pesa number.
 *
 * ---------------------------------------------------------------------------
 * percentage_charge: READ THIS BEFORE CHANGING IT
 * ---------------------------------------------------------------------------
 * It is REQUIRED. Omitting it fails with "Percentage charge is required".
 *
 * Its meaning is genuinely documented two different ways by Paystack:
 *
 *   paystack.com/docs/payments/split-payments
 *     "if a subaccount was created with percentage_charge: 20,
 *      20% goes to the MAIN ACCOUNT and the rest goes to the subaccount"
 *
 *   docs-v2.paystack.com/docs/payments/split-payments
 *     "if a subaccount was created with percentage_charge: 0.2,
 *      20% goes to the SUBACCOUNT and the rest goes to the main account"
 *
 * Those are opposite, and they even disagree on the scale (20 vs 0.2).
 * The Subaccount API reference -- the authoritative page for this specific
 * field -- resolves it:
 *
 *   docs-v2.production.paystack.co/docs/api/subaccount
 *     "percentage_charge: The percentage THE MAIN ACCOUNT RECEIVES from
 *      each payment made to the subaccount"
 *
 * and its own example passes a whole number (30 for 30%). So this value is
 * the PLATFORM's commission, as whole percent: 10, not 90.
 *
 * Note the deliberate asymmetry with initializeSplitTransaction below,
 * where `share` is the SUBACCOUNT's share (90). Both are correct in their
 * own context; they are framed from opposite sides. Both are derived from
 * the same commission figure so they cannot drift apart.
 *
 * This is still an inference from docs rather than an observed split, so
 * the caller echoes back whatever Paystack stored. Confirm it against a
 * real transaction before trusting live money to it.
 */
export function createSubaccount(params: {
  businessName: string;
  mpesaNumber: string; // normalised 254...
  platformPct: number; // platform commission, whole percent
  settlementBank?: string;
}) {
  return call<Subaccount>("/subaccount", {
    method: "POST",
    body: {
      business_name: params.businessName,
      settlement_bank: params.settlementBank ?? "MPESA",
      account_number: toLocalKePhone(params.mpesaNumber),
      percentage_charge: params.platformPct,
    },
  });
}

/** Read a subaccount back, to confirm what Paystack actually stored. */
export function fetchSubaccount(codeOrId: string) {
  return call<Subaccount>(`/subaccount/${encodeURIComponent(codeOrId)}`);
}

export type InitializedTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/**
 * Start a payment whose settlement is split with the host's subaccount.
 *
 * Uses the explicit `split` object rather than the bare `subaccount`
 * parameter: here `share` is unambiguously the SUBACCOUNT's share, so a
 * doc ambiguity cannot silently invert the split and pay the host 10%.
 *
 * bearer_type "account" keeps Paystack's fee on the platform account,
 * which is the behaviour we want: the host receives their full share.
 */
export function initializeSplitTransaction(params: {
  email: string;
  amountKes: number;
  reference: string;
  subaccountCode: string;
  hostSharePct: number;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<InitializedTransaction>("/transaction/initialize", {
    method: "POST",
    body: {
      email: params.email,
      // Paystack takes the smallest currency unit.
      amount: Math.round(params.amountKes * 100),
      currency: "KES",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      split: {
        type: "percentage",
        bearer_type: "account",
        subaccounts: [
          {
            subaccount: params.subaccountCode,
            share: params.hostSharePct,
          },
        ],
      },
    },
  });
}

export type VerifiedTransaction = {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  amount: number; // smallest unit
  currency: string;
  metadata?: Record<string, unknown>;
};

/** Verify a transaction server-side. Never trust the browser redirect. */
export function verifyTransaction(reference: string) {
  return call<VerifiedTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}
