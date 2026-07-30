import { createAdminClient } from "@/lib/supabase/admin";
import BarChart from "@/components/admin/BarChart";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "rose" | "gold";
}) {
  return (
    <div className="stat">
      <div className={"stat-value" + (accent ? ` stat-${accent}` : "")}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const now = Date.now();
  const start14 = new Date(now - 13 * DAY_MS);
  start14.setHours(0, 0, 0, 0);
  const since7 = new Date(now - 7 * DAY_MS).toISOString();

  const [usersRes, newRes, openRes, bannedRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("onboarding_done", true),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_banned", true),
  ]);

  const { data: recent } = await admin
    .from("profiles")
    .select("created_at")
    .gte("created_at", start14.toISOString());

  const days: { label: string; value: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start14.getTime() + i * DAY_MS);
    days.push({ label: String(d.getDate()), value: 0 });
  }
  (recent ?? []).forEach((p) => {
    const idx = Math.floor(
      (new Date(p.created_at).getTime() - start14.getTime()) / DAY_MS
    );
    if (idx >= 0 && idx < 14) days[idx].value += 1;
  });

  const { data: repRows } = await admin.from("reports").select("reason");
  const reasonMap: Record<string, number> = {};
  (repRows ?? []).forEach((r) => {
    reasonMap[r.reason] = (reasonMap[r.reason] ?? 0) + 1;
  });
  const reasons = Object.entries(reasonMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <h1 className="admin-h1">Dashboard</h1>

      <div className="stat-grid">
        <Stat label="Members" value={usersRes.count ?? 0} />
        <Stat label="New (7 days)" value={newRes.count ?? 0} />
        <Stat label="Open reports" value={openRes.count ?? 0} accent="rose" />
        <Stat label="Banned" value={bannedRes.count ?? 0} accent="gold" />
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h2 className="admin-h2">Signups — last 14 days</h2>
          <BarChart data={days} />
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Reports by reason</h2>
          {reasons.length ? (
            <BarChart data={reasons} horizontal />
          ) : (
            <p className="admin-empty">No reports yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
