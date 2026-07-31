import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminFeedback() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("feedback")
    .select("id, profile_id, rating, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const list = rows ?? [];

  const ids = Array.from(new Set(list.map((r) => r.profile_id)));
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

  return (
    <div>
      <h1 className="admin-h1">Feedback</h1>

      {list.length === 0 ? (
        <p className="admin-empty">
          No feedback yet. Post an announcement linking to /feedback to invite
          members to share their experience.
        </p>
      ) : (
        <div className="admin-fb-list">
          {list.map((f) => (
            <div key={f.id} className="admin-fb-item">
              <div className="admin-fb-head">
                <span className="admin-fb-name">
                  {nameMap[f.profile_id] ?? "Member"}
                </span>
                {f.rating != null && (
                  <span className="admin-fb-rating">{f.rating}/5</span>
                )}
                <span className="admin-fb-date">
                  {new Date(f.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="admin-fb-msg">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
