"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Give your event a title.");
      return;
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
    await supabase
      .from("event_bookings")
      .insert({ event_id: ev.id, profile_id: me });
    setBusy(false);
    setOpen(false);
    router.push(`/events/${ev.id}`);
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass ?? "btn"}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? triggerLabel ?? "Create an event"}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{existing ? "Edit event" : "Create an event"}</h3>
            <input
              className="modal-input"
              placeholder="Title (e.g. Rooftop Sundowner)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
            <input
              className="modal-input"
              placeholder="Venue (e.g. Sarova Stanley Rooftop)"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
            <div className="modal-row">
              <input
                className="modal-input"
                placeholder="Area (e.g. Westlands)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <input
                className="modal-input"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <input
              className="modal-input"
              placeholder="Country (e.g. Kenya, Uganda, Rwanda)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <input
              className="modal-input"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <div className="modal-row">
              <input
                className="modal-input"
                type="number"
                min={0}
                placeholder="Price KSh (0 = free)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="modal-input"
                type="number"
                min={1}
                placeholder="Capacity (optional)"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <input
              className="modal-input"
              placeholder="Cover image URL (optional)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <textarea
              className="modal-input"
              rows={3}
              placeholder="About this event (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
        </div>
      )}
    </>
  );
}
