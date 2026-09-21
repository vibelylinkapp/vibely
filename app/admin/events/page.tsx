import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import EventModerationBar from "@/components/EventModerationBar";
import { KE_TZ } from "@/lib/format";

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

type Contact = { email: string | null; phone: string | null } | null;

function fmt(iso: string | null): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: KE_TZ,
  });
}

function Card({ e, contact }: { e: Row; contact: Contact }) {
  // Terms section 12: a paid event must carry an organizer email and phone
  // before it is published, because ticket money settles straight to the
  // organizer and contacting them is the buyer's only route to a refund.
  const needsContact = e.price_kes > 0;
  const hasContact = Boolean(contact?.email || contact?.phone);
  const contactMissing = needsContact && !hasContact;
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
        <div className="modq-meta">
          {"Organizer contact: "}
          {hasContact ? (
            <>
              {contact?.email ? contact.email : "\u2014"}
              {" \u00b7 "}
              {contact?.phone ? contact.phone : "\u2014"}
            </>
          ) : needsContact ? (
            "missing"
          ) : (
            "none (free event)"
          )}
        </div>
        {contactMissing && (
          <div className="modq-reason">
            Paid event with no organizer contact. Terms section 12 requires an
            email and phone before a paid event is published, and section 15
            makes the organizer solely responsible for refunds. Do not publish
            until this is supplied.
          </div>
        )}
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

  // Organizer contact details for everything on screen, so a reviewer can
  // check them without opening each event.
  const ids = Array.from(new Set([...pending, ...recent].map((e) => e.id)));
  const contacts: Record<string, Contact> = {};
  if (ids.length) {
    const { data: crows } = await admin
      .from("event_organizer_contacts")
      .select("event_id, email, phone")
      .in("event_id", ids);
    (crows ?? []).forEach((c) => {
      contacts[c.event_id] = { email: c.email, phone: c.phone };
    });
  }

  return (
    <div>
      <h1 className="admin-h1">Event moderation</h1>

      <div className="admin-panel">
        <h2 className="admin-h2">Pending review ({pending.length})</h2>
        {pending.length ? (
          <div className="modq-list">
            {pending.map((e) => (
              <Card key={e.id} e={e} contact={contacts[e.id] ?? null} />
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
              <Card key={e.id} e={e} contact={contacts[e.id] ?? null} />
            ))}
          </div>
        ) : (
          <p className="admin-empty">No member events yet.</p>
        )}
      </div>
    </div>
  );
}
