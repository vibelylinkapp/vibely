import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const EAT_OFFSET = 3 * 3600000; // Kenya/East Africa time (UTC+3, no DST)
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Tier = Database["public"]["Enums"]["sub_tier_t"];
type SubRow = { tier: Tier; profile_id: string; expires_at: string | null };

const TIER_LABEL: Record<string, string> = {
  plus: "Plus",
  gold: "Gold",
  vip: "VIP",
  free: "Free",
};

// Format a timestamp as a short EAT date, e.g. "Aug 4".
function fmtDateEat(iso: string): string {
  const d = new Date(new Date(iso).getTime() + EAT_OFFSET);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function daysBetween(a: number, b: number): number {
  return Math.max(0, Math.ceil(Math.abs(a - b) / DAY_MS));
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

export default async function AdminRetention() {
  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const plus7Iso = new Date(now + 7 * DAY_MS).toISOString();
  const minus30Iso = new Date(now - 30 * DAY_MS).toISOString();

  const [activeRes, expiringRes, lapsedRes] = await Promise.all([
    // All active (unexpired) paid subscriptions — the recurring base.
    admin
      .from("subscriptions")
      .select("tier", { count: "exact", head: true })
      .neq("tier", "free")
      .gt("expires_at", nowIso),
    // Expiring within the next 7 days (still active, at renewal risk).
    admin
      .from("subscriptions")
      .select("tier, profile_id, expires_at")
      .neq("tier", "free")
      .gt("expires_at", nowIso)
      .lte("expires_at", plus7Iso)
      .order("expires_at", { ascending: true }),
    // Lapsed in the last 30 days (expired, not yet renewed) — the churn list.
    admin
      .from("subscriptions")
      .select("tier, profile_id, expires_at")
      .neq("tier", "free")
      .lt("expires_at", nowIso)
      .gte("expires_at", minus30Iso)
      .order("expires_at", { ascending: false }),
  ]);

  const activeCount = activeRes.count ?? 0;
  const expiring = (expiringRes.data ?? []) as SubRow[];
  const lapsed = (lapsedRes.data ?? []) as SubRow[];

  const expiring3 = expiring.filter(
    (s) => s.expires_at && new Date(s.expires_at).getTime() <= now + 3 * DAY_MS
  ).length;

  // Resolve member names for both lists in one query.
  const ids = Array.from(
    new Set([...expiring, ...lapsed].map((s) => s.profile_id))
  );
  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    (profs ?? []).forEach((p) => {
      nameMap[p.id] = p.display_name;
    });
  }

  // Win-back performance: how many lapsed members we nudged, and how many are
  // active subscribers again. A nudged member counts as reactivated if they
  // now hold an active, unexpired paid subscription (they had lapsed when
  // nudged, so being active now means they came back).
  const { data: nudgeRows } = await admin
    .from("nudges")
    .select("profile_id, created_at")
    .eq("kind", "winback");
  const nudgedSet = new Set((nudgeRows ?? []).map((n) => n.profile_id));
  const nudgedMembers = nudgedSet.size;
  const nudges30 = (nudgeRows ?? []).filter(
    (n) => n.created_at >= minus30Iso
  ).length;

  let reactivated = 0;
  if (nudgedMembers > 0) {
    const { data: reRows } = await admin
      .from("subscriptions")
      .select("profile_id")
      .in("profile_id", Array.from(nudgedSet))
      .neq("tier", "free")
      .eq("status", "active")
      .gt("expires_at", nowIso);
    reactivated = new Set((reRows ?? []).map((r) => r.profile_id)).size;
  }
  const reactivationRate =
    nudgedMembers > 0 ? Math.round((reactivated / nudgedMembers) * 100) : 0;

  return (
    <div>
      <h1 className="admin-h1">Renewal health</h1>

      <div className="stat-grid">
        <Stat label="Active subscriptions" value={activeCount} />
        <Stat
          label="Expiring \u2264 3 days"
          value={expiring3}
          accent="rose"
          hint="reach out to save"
        />
        <Stat label="Expiring \u2264 7 days" value={expiring.length} accent="gold" />
        <Stat
          label="Lapsed (30 days)"
          value={lapsed.length}
          hint="expired, not renewed"
        />
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h2 className="admin-h2">Expiring in the next 7 days</h2>
          {expiring.length === 0 ? (
            <p className="admin-empty">
              No subscriptions are expiring in the next week.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Tier</th>
                    <th>Expires</th>
                    <th>Days left</th>
                  </tr>
                </thead>
                <tbody>
                  {expiring.map((s, i) => (
                    <tr key={`${s.profile_id}-${i}`}>
                      <td>{nameMap[s.profile_id] ?? "Unknown"}</td>
                      <td>{TIER_LABEL[s.tier] ?? s.tier}</td>
                      <td>{s.expires_at ? fmtDateEat(s.expires_at) : "\u2014"}</td>
                      <td>
                        {s.expires_at
                          ? daysBetween(new Date(s.expires_at).getTime(), now)
                          : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-panel">
          <h2 className="admin-h2">Recently lapsed (last 30 days)</h2>
          {lapsed.length === 0 ? (
            <p className="admin-empty">No members have lapsed recently.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Tier</th>
                    <th>Expired</th>
                    <th>Days ago</th>
                  </tr>
                </thead>
                <tbody>
                  {lapsed.map((s, i) => (
                    <tr key={`${s.profile_id}-${i}`}>
                      <td>{nameMap[s.profile_id] ?? "Unknown"}</td>
                      <td>{TIER_LABEL[s.tier] ?? s.tier}</td>
                      <td>{s.expires_at ? fmtDateEat(s.expires_at) : "\u2014"}</td>
                      <td>
                        {s.expires_at
                          ? daysBetween(now, new Date(s.expires_at).getTime())
                          : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <h2 className="admin-h2" style={{ marginTop: 24 }}>
        Win-back performance
      </h2>
      <div className="stat-grid">
        <Stat label="Members nudged" value={nudgedMembers} />
        <Stat label="Reactivated" value={reactivated} accent="gold" />
        <Stat
          label="Reactivation rate"
          value={`${reactivationRate}%`}
          hint="of nudged members now active"
          accent="gold"
        />
        <Stat label="Nudges sent (30d)" value={nudges30} />
      </div>

      <p className="stat-hint" style={{ marginTop: 16 }}>
        A subscription lasts {30} days from its last payment. &ldquo;Lapsed&rdquo;
        members paid before but have not renewed &mdash; good candidates for a
        win-back nudge.
      </p>
    </div>
  );
}
