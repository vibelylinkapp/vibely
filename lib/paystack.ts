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
};

/** Create a subaccount that settles to a host's M-Pesa number. */
export function createSubaccount(params: {
  businessName: string;
  mpesaNumber: string; // normalised 254...
  settlementBank?: string;
}) {
  return call<Subaccount>("/subaccount", {
    method: "POST",
    body: {
      business_name: params.businessName,
      settlement_bank: params.settlementBank ?? "MPESA",
      account_number: toLocalKePhone(params.mpesaNumber),
      // percentage_charge is deliberately NOT set here. The two live
      // versions of Paystack's docs disagree about which side it applies
      // to, so the split is expressed explicitly per transaction instead
      // (see initializeSplitTransaction).
    },
  });
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
