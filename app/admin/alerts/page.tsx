import { computeAdminSummary, fmtKes } from "@/lib/admin/summary";
import SendSummaryButton from "@/components/admin/SendSummaryButton";

export const dynamic = "force-dynamic";

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

export default async function AdminAlerts() {
  const s = await computeAdminSummary();

  return (
    <div>
      <h1 className="admin-h1">Alerts</h1>

      <p className="stat-hint" style={{ marginBottom: 16 }}>
        A digest push is delivered to admins&rsquo; devices automatically each
        morning. Below is what it would say right now.
      </p>

      <h2 className="admin-h2">Last 24 hours</h2>
      <div className="stat-grid">
        <Stat label="New signups" value={s.signups24h} />
        <Stat label="Revenue collected" value={fmtKes(s.revenue24h)} accent="gold" />
        <Stat label="New / renewed subs" value={s.newOrRenewedSubs24h} />
        <Stat label="Open reports" value={s.openReports} accent="rose" />
      </div>

      <h2 className="admin-h2" style={{ marginTop: 24 }}>
        Standing figures
      </h2>
      <div className="stat-grid">
        <Stat label="MRR" value={fmtKes(s.mrr)} accent="gold" />
        <Stat label="Active subscriptions" value={s.activeSubs} />
        <Stat
          label="Expiring \u2264 7 days"
          value={s.expiringSoon7d}
          hint="renewal risk"
        />
        <Stat label="Signups (7 days)" value={s.signups7d} />
        <Stat
          label="Pending verifications"
          value={s.pendingVerifications}
          accent="rose"
        />
      </div>

      <div className="admin-panel" style={{ marginTop: 24 }}>
        <h2 className="admin-h2">Send now</h2>
        <p className="stat-hint" style={{ marginBottom: 12 }}>
          Push this digest to your registered devices immediately (useful to
          test that notifications are working).
        </p>
        <SendSummaryButton />
      </div>
    </div>
  );
}
