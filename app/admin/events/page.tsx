import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import EventModerationBar from "@/components/EventModerationBar";

export const dynamic = "force-dynamic";

const COLS =
  "id, title, status, is_trending, category, venue, area, city, country, starts_at, price_kes, host_name, created_by, rejected_reason, created_at";

type Row = {
  id: string;
  title: string;
  status: string;
  is_trending: boolean;
  category: string | null;
  venue: string | null;
  area: string | null;
  city: string;
  country: string;
  starts_at: string | null;
  price_kes: number;
  host_name: string | null;
  created_by: string | null;
  rejected_reason: string | null;
  created_at: string;
};

function fmt(iso: string | null): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Card({ e }: { e: Row }) {
  return (
    <div className="modq-card">
      <div className="modq-main">
        <div className="modq-title">
          <Link href={`/events/${e.id}`}>{e.title}</Link>
          <span className={`ev-badge is-${e.status}`}>{e.status}</span>
          {e.is_trending && <span className="ev-badge is-feat">Featured</span>}
        </div>
        <div className="modq-meta">
          {[e.category, e.venue, e.area, e.city, e.country]
            .filter(Boolean)
            .join(" \u00b7 ")}
        </div>
        <div className="modq-meta">
          {fmt(e.starts_at)} {"\u00b7"}{" "}
          {e.price_kes > 0
            ? `KSh ${e.price_kes.toLocaleString("en-KE")}`
            : "Free"}{" "}
          {"\u00b7"} Host {e.host_name ?? "\u2014"}
        </div>
        {e.rejected_reason && (
          <div className="modq-reason">Rejected: {e.rejected_reason}</div>
        )}
      </div>
      <EventModerationBar
        eventId={e.id}
        status={e.status}
        isTrending={e.is_trending}
      />
    </div>
  );
}

export default async function AdminEventsPage() {
  const admin = createAdminClient();

  const [{ data: pendingRows }, { data: recentRows }] = await Promise.all([
    admin
      .from("events")
      .select(COLS)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("events")
      .select(COLS)
      .in("status", ["published", "rejected"])
      .not("created_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pending = (pendingRows ?? []) as Row[];
  const recent = (recentRows ?? []) as Row[];

  return (
    <div>
      <h1 className="admin-h1">Event moderation</h1>

      <div className="admin-panel">
        <h2 className="admin-h2">Pending review ({pending.length})</h2>
        {pending.length ? (
          <div className="modq-list">
            {pending.map((e) => (
              <Card key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <p className="admin-empty">Nothing waiting for review.</p>
        )}
      </div>

      <div className="admin-panel">
        <h2 className="admin-h2">Recently reviewed member events</h2>
        {recent.length ? (
          <div className="modq-list">
            {recent.map((e) => (
              <Card key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <p className="admin-empty">No member events yet.</p>
        )}
      </div>
    </div>
  );
}
