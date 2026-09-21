"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CoverUpload from "./CoverUpload";

const CATS = [
  "Nightlife",
  "Music",
  "Outdoors",
  "Beach",
  "Coffee",
  "Food",
  "Networking",
  "Sports",
  "Arts",
  "Other",
];

export type ExistingEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  venue: string | null;
  area: string | null;
  city: string;
  country: string;
  starts_at: string | null;
  price_kes: number;
  capacity: number | null;
  image_url: string | null;
};

function toLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({
  existing,
  triggerLabel,
  triggerClass,
  triggerContent,
}: {
  existing?: ExistingEvent;
  triggerLabel?: string;
  triggerClass?: string;
  triggerContent?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATS[0]);
  const [venue, setVenue] = useState(existing?.venue ?? "");
  const [area, setArea] = useState(existing?.area ?? "");
  const [city, setCity] = useState(existing?.city ?? "Nairobi");
  const [country, setCountry] = useState(existing?.country ?? "Kenya");
  const [startsAt, setStartsAt] = useState(
    existing?.starts_at ? toLocal(existing.starts_at) : ""
  );
  const [price, setPrice] = useState(existing ? String(existing.price_kes) : "0");
  const [capacity, setCapacity] = useState(
    existing?.capacity ? String(existing.capacity) : ""
  );
  const [image, setImage] = useState(existing?.image_url ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  // Attendees who have paid need a way to reach the organizer: ticket money
  // settles straight to the organizer, so we cannot refund it for them and
  // contacting the organizer is their only remedy.
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Give your event a title.");
      return;
    }
    const priceNum = price ? Math.max(0, Math.round(Number(price))) : 0;
    if (priceNum > 0) {
      if (!organizerEmail.trim() || !organizerPhone.trim()) {
        setError(
          "Paid events need an email and phone number so ticket holders can reach you."
        );
        return;
      }
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    const patch = {
      title: title.trim(),
      category,
      venue: venue.trim() || null,
      area: area.trim() || null,
      city: city.trim() || "Nairobi",
      country: country.trim() || "Kenya",
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      price_kes: price ? Math.max(0, Math.round(Number(price))) : 0,
      capacity: capacity ? Math.max(1, Math.round(Number(capacity))) : null,
      image_url: image.trim() || null,
      description: description.trim() || null,
    };

    if (existing) {
      const { error: uErr } = await supabase
        .from("events")
        .update(patch)
        .eq("id", existing.id);
      if (uErr) {
        setError(uErr.message);
        setBusy(false);
        return;
      }
      setBusy(false);
      setOpen(false);
      router.refresh();
      return;
    }

    const { data: ev, error: iErr } = await supabase
      .from("events")
      .insert({ ...patch, created_by: me, host_name: "You", is_trending: false })
      .select("id")
      .single();
    if (iErr || !ev) {
      setError(iErr?.message ?? "Could not create the event.");
      setBusy(false);
      return;
    }
    if (organizerEmail.trim() || organizerPhone.trim()) {
      await supabase.from("event_organizer_contacts").upsert(
        {
          event_id: ev.id,
          email: organizerEmail.trim() || null,
          phone: organizerPhone.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id" }
      );
    }
    await supabase
      .from("event_bookings")
      .insert({ event_id: ev.id, profile_id: me });
    setBusy(false);
    setOpen(false);
    router.push(`/events/${ev.id}`);
  }

  // The trigger lives inside .feed-head, which has a backdrop-filter. That
  // makes the header the containing block for position:fixed descendants, so
  // the overlay's inset:0 resolved to the ~72px header instead of the
  // viewport -- the dialog was clipped to a sliver and the page painted over
  // it. Portalling to <body> puts it back in the viewport's coordinate space.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        type="button"
        className={triggerClass ?? "btn"}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? triggerLabel ?? "Create an event"}
      </button>

      {open && mounted && createPortal(
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{existing ? "Edit event" : "Create an event"}</h3>

            <div className="fld-sec">Basics</div>
            <label className="fld">
              <span className="fld-l">Event name</span>
              <input
                className="modal-input"
                placeholder="e.g. Rooftop Sundowner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="fld">
              <span className="fld-l">Category</span>
              <select
                className="modal-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="fld-sec">When</div>
            <label className="fld">
              <span className="fld-l">Starts</span>
              <input
                className="modal-input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              <span className="fld-hint">Date and time the event begins.</span>
            </label>

            <div className="fld-sec">Where</div>
            <label className="fld">
              <span className="fld-l">Venue</span>
              <input
                className="modal-input"
                placeholder="e.g. Sarova Stanley Rooftop"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </label>
            <div className="modal-row">
              <label className="fld">
                <span className="fld-l">Area</span>
                <input
                  className="modal-input"
                  placeholder="e.g. Westlands"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </label>
              <label className="fld">
                <span className="fld-l">City</span>
                <input
                  className="modal-input"
                  placeholder="e.g. Nairobi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
            </div>
            <label className="fld">
              <span className="fld-l">Country</span>
              <input
                className="modal-input"
                placeholder="e.g. Kenya"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>

            <div className="fld-sec">Details</div>
            <div className="modal-row">
              <label className="fld">
                <span className="fld-l">Price (KSh)</span>
                <input
                  className="modal-input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="fld-hint">Leave 0 for a free event.</span>
              </label>
              <label className="fld">
                <span className="fld-l">
                  Capacity <em>optional</em>
                </span>
                <input
                  className="modal-input"
                  type="number"
                  min={1}
                  placeholder="No limit"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </label>
            </div>
            <CoverUpload value={image} onChange={setImage} />
            <label className="fld">
              <span className="fld-l">
                About this event <em>optional</em>
              </span>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="What should people know before they come?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="fld-sec">Contact for attendees</div>
            <label className="fld">
              <span className="fld-l">Your email</span>
              <input
                className="modal-input"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
              />
            </label>
            <label className="fld">
              <span className="fld-l">Your phone</span>
              <input
                className="modal-input"
                type="tel"
                inputMode="numeric"
                placeholder="07xx xxx xxx"
                value={organizerPhone}
                onChange={(e) => setOrganizerPhone(e.target.value)}
              />
            </label>
            <p className="mpesa-note">
              Shared only with people who hold a confirmed ticket, so they can
              reach you if plans change. Required for paid events.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Saving..." : existing ? "Save" : "Create"}
              </button>
            </div>
            {error && <p className="auth-msg">{error}</p>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
