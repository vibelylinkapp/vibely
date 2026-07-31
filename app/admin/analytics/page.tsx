import { createAdminClient } from "@/lib/supabase/admin";
import BarChart from "@/components/admin/BarChart";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const EAT_OFFSET = 3 * 3600000; // Kenya/East Africa time (UTC+3, no DST)

// Start of the current calendar day in EAT, as a UTC Date.
function startOfEatDay(now: number): Date {
  const eatMidnight = Math.floor((now + EAT_OFFSET) / DAY_MS) * DAY_MS;
  return new Date(eatMidnight - EAT_OFFSET);
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

function bucket14(
  rows: { created_at: string }[] | null,
  start14: Date
): { label: string; value: number }[] {
  const days: { label: string; value: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start14.getTime() + i * DAY_MS);
    days.push({ label: String(d.getDate()), value: 0 });
  }
  (rows ?? []).forEach((r) => {
    const idx = Math.floor(
      (new Date(r.created_at).getTime() - start14.getTime()) / DAY_MS
    );
    if (idx >= 0 && idx < 14) days[idx].value += 1;
  });
  return days;
}

export default async function AdminAnalytics() {
  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const since7 = new Date(now - 7 * DAY_MS).toISOString();
  const since30 = new Date(now - 30 * DAY_MS).toISOString();
  const todayStart = startOfEatDay(now).toISOString();
  const start14 = startOfEatDay(now - 13 * DAY_MS);

  const [
    totalBoosts,
    activeBoosts,
    boosts7d,
    boosts30d,
    totalLikes,
    likesToday,
    likes7d,
    totalMatches,
  ] = await Promise.all([
    admin.from("boosts").select("id", { count: "exact", head: true }),
    admin
      .from("boosts")
      .select("id", { count: "exact", head: true })
      .gt("expires_at", nowIso),
    admin
      .from("boosts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    admin
      .from("boosts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    admin.from("likes").select("liked_id", { count: "exact", head: true }),
    admin
      .from("likes")
      .select("liked_id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("likes")
      .select("liked_id", { count: "exact", head: true })
      .gte("created_at", since7),
    admin.from("matches").select("u1", { count: "exact", head: true }),
  ]);

  const likeCount = totalLikes.count ?? 0;
  const matchCount = totalMatches.count ?? 0;
  // Every match is a pair of reciprocal likes, so it accounts for two likes.
  const matchRate =
    likeCount > 0 ? Math.round((matchCount * 2 * 100) / likeCount) : 0;

  const [{ data: likeRows }, { data: boostRows }] = await Promise.all([
    admin
      .from("likes")
      .select("created_at")
      .gte("created_at", start14.toISOString()),
    admin
      .from("boosts")
      .select("created_at")
      .gte("created_at", start14.toISOString()),
  ]);

  const likeDays = bucket14(likeRows, start14);
  const boostDays = bucket14(boostRows, start14);

  return (
    <div>
      <h1 className="admin-h1">Analytics</h1>

      <h2 className="admin-h2">Likes &amp; matches</h2>
      <div className="stat-grid">
        <Stat label="Total likes" value={likeCount} />
        <Stat label="Likes today" value={likesToday.count ?? 0} />
        <Stat label="Likes (7 days)" value={likes7d.count ?? 0} />
        <Stat label="Matches" value={matchCount} accent="rose" />
        <Stat
          label="Match rate"
          value={`${matchRate}%`}
          hint="share of likes that matched"
          accent="gold"
        />
      </div>

      <h2 className="admin-h2" style={{ marginTop: 24 }}>
        Boosts
      </h2>
      <div className="stat-grid">
        <Stat label="Active now" value={activeBoosts.count ?? 0} accent="gold" />
        <Stat label="Boosts (7 days)" value={boosts7d.count ?? 0} />
        <Stat label="Boosts (30 days)" value={boosts30d.count ?? 0} />
        <Stat label="Total boosts" value={totalBoosts.count ?? 0} />
      </div>

      <div className="admin-panels">
        <div className="admin-panel">
          <h2 className="admin-h2">Likes — last 14 days</h2>
          {likeRows && likeRows.length ? (
            <BarChart data={likeDays} />
          ) : (
            <p className="admin-empty">No likes yet.</p>
          )}
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Boosts — last 14 days</h2>
          {boostRows && boostRows.length ? (
            <BarChart data={boostDays} />
          ) : (
            <p className="admin-empty">No boosts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
