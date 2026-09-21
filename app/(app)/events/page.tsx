import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard, { EventCardData } from "@/components/EventCard";
import EventForm from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: rows } = await supabase
    .from("events")
    .select(
      "id, title, image_url, category, venue, area, city, country, price_kes, starts_at, going_base, is_trending"
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true })
    .limit(60);

  const { data: mineRows } = await supabase
    .from("events")
    .select("id, title, status, area, city, starts_at")
    .eq("created_by", user.id)
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false });
  const submissions = mineRows ?? [];

  const now = Date.now();
  const events = (rows ?? []).filter(
    (e) => !e.starts_at || new Date(e.starts_at).getTime() >= now - 3600000
  );

  const ids = events.map((e) => e.id);
  const going: Record<string, number> = {};
  if (ids.length) {
    const { data: bk } = await supabase
      .from("event_bookings")
      .select("event_id")
      .in("event_id", ids);
    (bk ?? []).forEach((b) => {
      going[b.event_id] = (going[b.event_id] ?? 0) + 1;
    });
  }

  const toCard = (e: (typeof events)[number]): EventCardData => ({
    id: e.id,
    title: e.title,
    image_url: e.image_url,
    category: e.category,
    venue: e.venue,
    area: e.area,
    city: e.city,
    country: e.country,
    price_kes: e.price_kes,
    starts_at: e.starts_at,
    going: (going[e.id] ?? 0) + e.going_base,
  });

  const trending = events.filter((e) => e.is_trending).map(toCard);
  const all = events.map(toCard);

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Events</span>
        <EventForm triggerLabel="+ Host" triggerClass="feed-head-btn" />
      </div>

      {trending.length > 0 && (
        <>
          <div className="sec">
            <h3>Trending near you</h3>
            <Link href="/heatmap">Map</Link>
          </div>
          <div className="hscroll">
            {trending.map((e) => (
              <EventCard key={e.id} e={e} variant="rail" />
            ))}
          </div>
        </>
      )}

      <div className="sec">
        <h3>Upcoming</h3>
      </div>
      {all.length > 0 ? (
        <div className="events-list">
          {all.map((e) => (
            <EventCard key={e.id} e={e} variant="list" />
          ))}
        </div>
      ) : (
        <div className="ev-empty">
          <div className="ev-empty-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3 11h18" />
            </svg>
          </div>
          <h4>No events yet</h4>
          <p>
            Vibely is new here. Anything you host shows up on this page for
            everyone nearby, and people can reach you on WhatsApp to ask about
            it.
          </p>
          <EventForm triggerLabel="Host the first event" triggerClass="btn ev-empty-cta" />
        </div>
      )}

    </main>
  );
}
