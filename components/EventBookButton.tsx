"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EventBookButton({
  eventId,
  booked,
  priceKes,
  full,
}: {
  eventId: string;
  booked: boolean;
  priceKes: number;
  full: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState(booked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    if (state) {
      await supabase
        .from("event_bookings")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", me);
      setState(false);
    } else {
      await supabase
        .from("event_bookings")
        .insert({ event_id: eventId, profile_id: me });
      setState(true);
    }
    setBusy(false);
    router.refresh();
  }

  if (!state && full) {
    return (
      <button type="button" className="btn btn-primary book-btn" disabled style={{ flex: 1 }}>
        Sold out
      </button>
    );
  }

  const label = busy
    ? "..."
    : state
      ? "Booked \u2713 Tap to cancel"
      : priceKes > 0
        ? "Get ticket"
        : "RSVP - I'm going";

  return (
    <button
      type="button"
      className={"btn btn-primary book-btn" + (state ? " booked" : "")}
      onClick={toggle}
      disabled={busy}
      style={{ flex: 1 }}
    >
      {label}
    </button>
  );
}
