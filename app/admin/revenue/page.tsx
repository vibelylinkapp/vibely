import { createAdminClient } from "@/lib/supabase/admin";
import BarChart from "@/components/admin/BarChart";
import { TIER_PRICES, type PaidTier } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const EAT_OFFSET = 3 * 3600000; // Kenya/East Africa time (UTC+3, no DST)

const PAID_TIERS: PaidTier[] = ["plus", "gold", "vip"];
const TIER_LABEL: Record<PaidTier, string> = {
  plus: "Plus",
  gold: "Gold",
  vip: "VIP",
};

// Start of the current calendar day in EAT, as a UTC Date.
function startOfEatDay(now: number): Date {
  const eatMidnight = Math.floor((now + EAT_OFFSET) / DAY_MS) * DAY_MS;
  return new Date(eatMidnight - EAT_OFFSET);
}

// Thousands-separated KES amount, ICU-independent so it renders the same
// regardless of the server's locale data.
function fmtKes(n: number): string {
  return "KES " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "rose" | "gold";
}) {
  return (
    <div className="stat">
      <div className={"stat-value" + (accent ? ` stat-${accent}` : "")}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export default async function AdminRevenue() {
  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const since7 = new Date(now - 7 * DAY_MS).toISOString();
  const since30 = new Date(now - 30 * DAY_MS).toISOString();
  const start14 = startOfEatDay(now - 13 * DAY_MS);

  // Active, unexpired subscriptions = the recurring base. One row per member,
  // so counts don't double up.
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("tier")
    .eq("status", "active")
    .gt("expires_at", nowIso);

  const tierCounts: Record<PaidTier, number> = { plus: 0, gold: 0, vip: 0 };
  (activeSubs ?? []).forEach((s) => {
    if (s.tier === "plus" || s.tier === "gold" || s.tier === "vip") {
      tierCounts[s.tier] += 1;
    }
  });
  const mrr = PAID_TIERS.reduce(
    (sum, t) => sum + tierCounts[t] * TIER_PRICES[t],
    0
  );
  const payingMembers = PAID_TIERS.reduce((n, t) => n + tierCounts[t], 0);

  // Only genuinely-collected money: M-Pesa marks a paid row status="success".
  const { data: paidRows } = await admin
    .from("payments")
    .select("amount_kes, created_at")
    .eq("status", "success")
    .gte("created_at", since30);

  let rev7 = 0;
  let rev30 = 0;
  const revDays: { label: string; value: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start14.getTime() + i * DAY_MS);
    revDays.push({ label: String(d.getDate()), value: 0 });
  }
  (paidRows ?? []).forEach((p) => {
    rev30 += p.amount_kes;
    if (p.created_at >= since7) rev7 += p.amount_kes;
    const idx = Math.floor(
      (new Date(p.created_at).getTime() - start14.getTime()) / DAY_MS
    );
    if (idx >= 0 && idx < 14) revDays[idx].value += p.amount_kes;
  });

  const subsByTier = PAID_TIERS.map((t) => ({
    label: `${TIER_LABEL[t]} · ${TIER_PRICES[t]}`,
    value: tierCounts[t],
  }));

  return (
    <div>
      <h1 className="admin-h1">Revenue</h1>

      <div className="stat-grid">
        <Stat
          label="MRR"
          value={fmtKes(mrr)}
          hint={`${payingMembers} active ${
            payingMembers === 1 ? "subscription" : "subscriptions"
          }`}
          accent="gold"
        />
        <Stat label="Collected (7 days)" value={fmtKes(rev7)} />
        <Stat label="Collected (30 days)" value={fmtKes(rev30)} />
        <Stat label="Paying members" value={payingMembers} accent="rose" />
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h2 className="admin-h2">Active subscribers by tier</h2>
          {payingMembers > 0 ? (
            <BarChart data={subsByTier} horizontal />
          ) : (
            <p className="admin-empty">No active subscriptions yet.</p>
          )}
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Collected revenue — last 14 days</h2>
          {paidRows && paidRows.length ? (
            <BarChart data={revDays} />
          ) : (
            <p className="admin-empty">No payments collected yet.</p>
          )}
        </div>
      </div>

      <p className="stat-hint" style={{ marginTop: 16 }}>
        MRR is the sum of active, unexpired subscriptions at current tier
        prices. Collected figures count only M-Pesa payments confirmed as paid.
      </p>
    </div>
  );
}
