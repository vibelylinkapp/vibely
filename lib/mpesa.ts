// Safaricom Daraja (M-Pesa) helper — server only. Never import client-side.
// Env vars:
//   MPESA_ENV            "sandbox" (default) | "production"
//   MPESA_CONSUMER_KEY   Daraja app consumer key
//   MPESA_CONSUMER_SECRET
//   MPESA_SHORTCODE      Paybill business shortcode
//   MPESA_PASSKEY        Lipa na M-Pesa Online passkey
//   MPESA_CALLBACK_URL   (optional) public https URL to /api/mpesa/callback
//   MPESA_CALLBACK_SECRET (optional) shared secret appended to the callback URL
//                        as ?t=... and verified by /api/mpesa/callback

const BASE =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export function mpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY
  );
}

// Normalise Kenyan numbers to Daraja's 2547XXXXXXXX / 2541XXXXXXXX form.
export function normalizeKePhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.startsWith("254")) {
    // already prefixed
  } else if (d.startsWith("7") || d.startsWith("1")) d = "254" + d;
  if (!/^254(7|1)\d{8}$/.test(d)) return null;
  return d;
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Daraja auth returned no token");
  return json.access_token;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

export type StkResult = {
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
};

export async function stkPush(params: {
  phone: string; // 2547XXXXXXXX
  amount: number;
  accountRef: string;
  description: string;
  callbackUrl: string;
}): Promise<StkResult> {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const ts = timestamp();
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${ts}`
  ).toString("base64");

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline", // Paybill
    Amount: Math.max(1, Math.round(params.amount)),
    PartyA: params.phone,
    PartyB: shortcode,
    PhoneNumber: params.phone,
    CallBackURL: params.callbackUrl,
    AccountReference: params.accountRef.slice(0, 12),
    TransactionDesc: params.description.slice(0, 13),
  };

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as Record<string, string>;
  if (!res.ok || json.ResponseCode !== "0") {
    throw new Error(
      json.errorMessage || json.ResponseDescription || "STK push failed"
    );
  }
  return {
    checkoutRequestId: json.CheckoutRequestID,
    merchantRequestId: json.MerchantRequestID,
    customerMessage: json.CustomerMessage,
  };
}
