import { createAdminClient } from "@/lib/supabase/admin";
import ReportRow from "@/components/admin/ReportRow";

export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = reports ?? [];
  const ids = Array.from(
    new Set(
      list
        .flatMap((r) => [r.reporter_id, r.reported_id])
        .filter((x): x is string => !!x)
    )
  );

  const nameMap: Record<string, string> = {};
  const bannedMap: Record<string, boolean> = {};
  if (ids.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name, is_banned")
      .in("id", ids);
    (profs ?? []).forEach((p) => {
      nameMap[p.id] = p.display_name;
      bannedMap[p.id] = p.is_banned;
    });
  }

  return (
    <div>
      <h1 className="admin-h1">Reports</h1>

      {list.length === 0 ? (
        <p className="admin-empty">
          No reports yet. When a user reports someone, the incident shows up
          here for review.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reported</th>
                <th>Reason</th>
                <th>Details</th>
                <th>Reported by</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  reportedName={
                    r.reported_id ? nameMap[r.reported_id] ?? "Unknown" : "Unknown"
                  }
                  reporterName={
                    r.reporter_id ? nameMap[r.reporter_id] ?? "Unknown" : "Unknown"
                  }
                  reportedBanned={
                    r.reported_id ? bannedMap[r.reported_id] ?? false : false
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
