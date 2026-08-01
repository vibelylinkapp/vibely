import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventBookButton from "@/components/EventBookButton";
import EventForm, { ExistingEvent } from "@/components/EventForm";
import EventModerationBar from "@/components/EventModerationBar";
import { compactCount } from "@/lib/format";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "Date to be announced";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtTime(iso: string | null): string {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtPrice(kes: number): string {
  return kes > 0 ? `KSh ${kes.toLocaleString("en-KE")}` : "Free";
}

export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: e } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (!e) notFound();

  const [{ count }, { data: mine }, { data: me }] = await Promise.all([
    supabase
      .from("event_bookings")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id),
    supabase
      .from("event_bookings")
      .select("event_id")
      .eq("event_id", id)
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  const going = (count ?? 0) + e.going_base;
  const booked = Boolean(mine);
  const canEdit = e.created_by === user.id || Boolean(me?.is_admin);
  const full = Boolean(e.capacity) && going >= (e.capacity ?? 0);
  const location =
    [e.venue, e.area, e.city].filter(Boolean).join(", ") || e.city;
  const region = e.country && e.country !== "Kenya" ? `, ${e.country}` : "";

  const existing: ExistingEvent = {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    venue: e.venue,
    area: e.area,
    city: e.city,
    country: e.country,
    starts_at: e.starts_at,
    price_kes: e.price_kes,
    capacity: e.capacity,
    image_url: e.image_url,
  };

  return (
    <main className="ev-detail">
      <div
        className="ev-hero"
        style={
          e.image_url ? { backgroundImage: `url('${e.image_url}')` } : undefined
        }
      >
        <div className="ev-hero-grad" />
        <div className="ev-hero-nav">
          <Link href="/events" className="ev-iconbtn" aria-label="Back">
            &#8249;
          </Link>
          {canEdit && (
            <EventForm
              existing={existing}
              triggerLabel="Edit"
              triggerClass="ev-iconbtn ev-edit"
            />
          )}
        </div>
        <div className="ev-hero-cap">
          <span className="price">{fmtPrice(e.price_kes)}</span>
          <h1>{e.title}</h1>
        </div>
      </div>

      <div className="ev-body">
        <div className="metabox">
          <div className="ic">&#128197;</div>
          <div>
            <b>{fmtDate(e.starts_at)}</b>
            <small>
              {fmtTime(e.starts_at)}
              {e.ends_at ? ` - ${fmtTime(e.ends_at)}` : ""}
            </small>
          </div>
        </div>
        <div className="metabox">
          <div className="ic">&#128205;</div>
          <div>
            <b>{e.venue ?? location}</b>
            <small>
              {location}
              {region}
            </small>
          </div>
        </div>
        {e.host_name && (
          <div className="metabox">
            <div className="ic">&#127903;</div>
            <div>
              <b>{e.category ?? "Event"}</b>
              <small>Hosted by {e.host_name}</small>
            </div>
          </div>
        )}

        <div className="ev-going">
          <b>{compactCount(going)}</b> going
          {e.capacity
            ? ` \u00b7 ${Math.max(0, e.capacity - going)} spots left`
            : ""}
        </div>

        {e.description && (
          <>
            <h4>About this vibe</h4>
            <p className="ev-about">{e.description}</p>
          </>
        )}

        <h4>Location</h4>
        <div className="ev-map" aria-hidden="true">
          <span>&#128205;</span>
        </div>
      </div>

      <div className="ev-bookbar">
        <div className="ev-bookprice">
          <small>Price</small>
          <b>{fmtPrice(e.price_kes)}</b>
        </div>
        <EventBookButton
          eventId={e.id}
          booked={booked}
          priceKes={e.price_kes}
          full={full}
        />
      </div>
    </main>
  );
}
