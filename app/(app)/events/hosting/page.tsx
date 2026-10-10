import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KE_TZ } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Host dashboard: every event the member has created, with its review
 * status, booking numbers and the member's payout set-up.
 *
 * Everything runs on the member's own session, so RLS limits it to their
 * data: `events` the member created, `event_bookings` for those events
 * (eb_read lets a host read bookings on their own events) and their own
 * `host_payouts` row (hp_self_read).
 */

type HostEvent = {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  price_kes: number;
  capacity: number | null;
  going_base: number;
  city: string;
  area: string | null;
  rejected_reason: string | null;
};

function fmtWhen(iso: string | null): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: KE_TZ,
  });
}

const STATUS_LABEL: Record<string, string> = {
  published: "Live",
  pending: "In review",
  rejected: "Not approved",
  past: "Ended",
};

export default async function HostingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/events/hosting");

  const [{ data: eventRows }, { data: payout }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, status, starts_at, price_kes, capacity, going_base, city, area, rejected_reason"
      )
      .eq("created_by", user.id)
      .order("starts_at", { ascending: false, nullsFirst: true })
      .limit(100),
    supabase
      .from("host_payouts")
      .select("status, mpesa_number, last_error")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const events = (eventRows ?? []) as HostEvent[];
  const ids = events.map((e) => e.id);

  // Booking counts per event, split by state. The host's own automatic
  // booking (added when the event is created) is excluded.
  const counts: Record<string, { confirmed: number; pending: number }> = {};
  if (ids.length) {
    const { data: bookings } = await supabase
      .from("event_bookings")
      .select("event_id, status, profile_id")
      .in("event_id", ids);
    (bookings ?? []).forEach((b) => {
      if (b.profile_id === user.id) return;
      const c = (counts[b.event_id] ??= { confirmed: 0, pending: 0 });
      if (b.status === "pending_payment") c.pending += 1;
      else c.confirmed += 1;
    });
  }

  const hasPaid = events.some((e) => e.price_kes > 0);
  const now = Date.now();

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <Link href="/events" className="feed-head-btn" aria-label="Back to events">
          &larr; Events
        </Link>
        <span className="feed-title">Your events</span>
      </div>

      <p className="host-intro">
        Every event you host, its review status and who has booked. New and
        edited events are reviewed before they go live.
      </p>

      {hasPaid && (
        <div className="host-payout" role="status">
          {payout?.status === "active" ? (
            <>
              <b>Payouts are set up</b>
              Ticket money settles straight to your M-Pesa number, less the
              platform commission.
            </>
          ) : payout?.status === "failed" ? (
            <>
              <b>Payout setup failed</b>
              {payout.last_error ?? "Please try again."}{" "}
              <Link href="/profile" className="host-link">
                Fix in Profile
              </Link>
            </>
          ) : (
            <>
              <b>Set up payouts to receive ticket money</b>
              Add your M-Pesa number so paid bookings settle to you.{" "}
              <Link href="/profile" className="host-link">
                Set up in Profile
              </Link>
            </>
          )}
        </div>
      )}

      {events.length === 0 ? (
        <div className="ev-empty">
          <h4>You have not hosted an event yet</h4>
          <p>Create one from the Events page and it will appear here.</p>
          <Link href="/events" className="btn ev-empty-cta">
            Go to Events
          </Link>
        </div>
      ) : (
        <div className="host-list">
          {events.map((e) => {
            const ended =
              e.status === "published" &&
              e.starts_at !== null &&
              new Date(e.starts_at).getTime() < now - 3600000;
            const statusKey = ended ? "past" : e.status;
            const c = counts[e.id] ?? { confirmed: 0, pending: 0 };
            const revenue = c.confirmed * e.price_kes;
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="host-ev">
                <div className="host-ev-top">
                  <span className="host-ev-title">{e.title}</span>
                  <span className={`host-status ${statusKey}`}>
                    {STATUS_LABEL[statusKey] ?? statusKey}
                  </span>
                </div>
                <div className="host-ev-meta">
                  {fmtWhen(e.starts_at)} &middot;{" "}
                  {[e.area, e.city].filter(Boolean).join(", ")}
                </div>
                <div className="host-ev-stats">
                  <span>
                    <b>{c.confirmed}</b> booked
                    {e.capacity ? ` of ${e.capacity}` : ""}
                  </span>
                  {c.pending > 0 && (
                    <span>
                      <b>{c.pending}</b> awaiting payment
                    </span>
                  )}
                  <span>
                    {e.price_kes > 0
                      ? `KSh ${revenue.toLocaleString("en-KE")} in tickets`
                      : "Free event"}
                  </span>
                </div>
                {e.status === "rejected" && e.rejected_reason && (
                  <div className="host-ev-reason">
                    Reason: {e.rejected_reason}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
