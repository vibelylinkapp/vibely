import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic: answers two questions we cannot answer from the
 * public Paystack docs, using the server-side secret key so no key is ever
 * handled in chat or exposed to the browser.
 *
 *   1. Is PAYSTACK_SECRET_KEY actually reaching this deployment, and is it
 *      a test key?
 *   2. Can a Kenyan SUBACCOUNT settle to M-Pesa, or only to a bank account?
 *      Subaccounts require a `settlement_bank` code, so if Paystack lists
 *      mobile-money destinations for Kenya then hosts can be paid to a
 *      phone number. If only banks come back, every host needs a bank
 *      account -- which would exclude most individual hosts.
 *
 * Safe to delete once the settlement model is decided.
 */

type Bank = {
  name: string;
  code: string;
  type?: string;
  currency?: string;
};

type Probe = {
  ok: boolean;
  status: number;
  message?: string;
  data: Bank[];
};

async function probe(qs: string, key: string): Promise<Probe> {
  try {
    const r = await fetch(`https://api.paystack.co/bank?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const j = (await r.json()) as {
      message?: string;
      data?: Bank[];
    };
    return {
      ok: r.ok,
      status: r.status,
      message: j?.message,
      data: Array.isArray(j?.data) ? j.data : [],
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      message: e instanceof Error ? e.message : "request failed",
      data: [],
    };
  }
}

export default async function PaystackCheckPage() {
  await requireAdmin();

  const key = process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    return (
      <div>
        <h1 className="admin-h1">Paystack check</h1>
        <div className="admin-panel">
          <p className="admin-empty">
            PAYSTACK_SECRET_KEY is not set in this deployment. Add it in Vercel
            (Settings, Environment Variables) and redeploy -- environment
            variables only apply to new builds.
          </p>
        </div>
      </div>
    );
  }

  const isTest = key.startsWith("sk_test_");
  const looksLikeSecret = key.startsWith("sk_");

  const [mobileMoney, allBanks] = await Promise.all([
    probe("country=kenya&type=mobile_money", key),
    probe("country=kenya", key),
  ]);

  const mmOk = mobileMoney.ok && mobileMoney.data.length > 0;

  return (
    <div>
      <h1 className="admin-h1">Paystack check</h1>

      <div className="admin-panel">
        <h2 className="admin-h2">Key</h2>
        <ul>
          <li>Present: yes</li>
          <li>
            Shape: {looksLikeSecret ? "secret key (sk_)" : "NOT a secret key"}
            {looksLikeSecret
              ? isTest
                ? " -- test mode"
                : " -- LIVE mode, be careful"
              : " -- this looks like a public key; the secret key is required"}
          </li>
          <li>
            Authenticates with Paystack:{" "}
            {allBanks.ok
              ? "yes"
              : `no (HTTP ${allBanks.status}${
                  allBanks.message ? ` -- ${allBanks.message}` : ""
                })`}
          </li>
        </ul>
      </div>

      <div className="admin-panel">
        <h2 className="admin-h2">
          Can a host be paid to M-Pesa? {mmOk ? "YES" : "NO"}
        </h2>
        <p>
          Kenyan mobile-money settlement destinations returned:{" "}
          <b>{mobileMoney.data.length}</b>
          {mobileMoney.ok
            ? ""
            : ` (HTTP ${mobileMoney.status}${
                mobileMoney.message ? ` -- ${mobileMoney.message}` : ""
              })`}
        </p>
        {mobileMoney.data.length > 0 ? (
          <ul>
            {mobileMoney.data.map((b) => (
              <li key={`${b.code}-${b.name}`}>
                {b.name} -- code <code>{b.code}</code>
                {b.currency ? ` (${b.currency})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">
            No mobile-money destinations. If this is empty, subaccounts can
            only settle to the bank accounts listed below, so every host would
            need a Kenyan bank account.
          </p>
        )}
      </div>

      <div className="admin-panel">
        <h2 className="admin-h2">Kenyan banks available for settlement</h2>
        <p>
          Returned: <b>{allBanks.data.length}</b>
        </p>
        <ul>
          {allBanks.data.slice(0, 15).map((b) => (
            <li key={`${b.code}-${b.name}`}>
              {b.name} -- code <code>{b.code}</code>
              {b.type ? ` (type: ${b.type})` : ""}
            </li>
          ))}
        </ul>
        {allBanks.data.length > 15 ? (
          <p className="admin-empty">
            ...and {allBanks.data.length - 15} more.
          </p>
        ) : null}
      </div>
    </div>
  );
}
