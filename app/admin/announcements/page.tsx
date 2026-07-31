import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAnnouncement,
  setAnnouncementActive,
  deleteAnnouncement,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncements() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("announcements")
    .select("id, body, link, active, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const list = rows ?? [];

  return (
    <div>
      <h1 className="admin-h1">Announcements</h1>
      <p className="admin-note-intro">
        Post a notice that appears as a banner at the top of everyone&apos;s
        Home. Members can dismiss it. Only the most recent active notice is
        shown.
      </p>

      <form action={createAnnouncement} className="admin-ann-form">
        <label className="admin-ann-field">
          <span>Message</span>
          <textarea
            name="body"
            rows={3}
            required
            maxLength={280}
            placeholder="e.g. Vibely Live at The Alchemist this Friday — first 50 people in free."
          />
        </label>
        <label className="admin-ann-field">
          <span>Link (optional)</span>
          <input
            name="link"
            type="text"
            placeholder="/events or https://example.com"
          />
        </label>
        <button type="submit" className="btn">
          Post announcement
        </button>
      </form>

      {list.length === 0 ? (
        <p className="admin-empty">
          No announcements yet. Post one above and it appears on Home right
          away.
        </p>
      ) : (
        <div className="admin-ann-list">
          {list.map((a) => (
            <div
              key={a.id}
              className={"admin-ann-item" + (a.active ? " on" : "")}
            >
              <div className="admin-ann-main">
                <span
                  className={
                    "admin-ann-badge" + (a.active ? " live" : " hidden")
                  }
                >
                  {a.active ? "Live" : "Hidden"}
                </span>
                <p className="admin-ann-text">{a.body}</p>
                {a.link && <span className="admin-ann-url">{a.link}</span>}
              </div>
              <div className="admin-ann-btns">
                <form action={setAnnouncementActive}>
                  <input type="hidden" name="id" value={a.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={a.active ? "false" : "true"}
                  />
                  <button type="submit" className="btn-ghost">
                    {a.active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="btn-ghost admin-ann-del">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
