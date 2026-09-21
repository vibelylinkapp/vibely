"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { forDisplay } from "@/lib/phone";

type Phase = "idle" | "phone" | "sending" | "waiting" | "done" | "error";

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const paid = priceKes > 0;

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  // ---- free events: RSVP straight away (unchanged behaviour) ----------
  async function toggleFree() {
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
        .insert({ event_id: eventId, profile_id: me, status: "confirmed" });
      setState(true);
    }
    setBusy(false);
    router.refresh();
  }

  async function cancelBooking() {
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (me) {
      await supabase
        .from("event_bookings")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", me);
      setState(false);
    }
    setBusy(false);
    router.refresh();
  }

  // ---- paid events: open the phone step, prefilled where possible ----
  async function openPhone() {
    setPhase("phone");
    setNote("");
    if (phone) return;
    // Convenience: most members have already saved a number for WhatsApp,
    // so reuse it instead of making them type it again.
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) return;
      const { data } = await supabase
        .from("member_contacts")
        .select("whatsapp")
        .eq("profile_id", me)
        .maybeSingle();
      if (data?.whatsapp) setPhone(forDisplay(data.whatsapp));
    } catch {
      /* prefill is a nicety; typing still works */
    }
  }

  const poll = useCallback(
    (checkoutId: string, tries: number) => {
      const t = setTimeout(async () => {
        try {
          const r = await fetch(
            `/api/mpesa/status?checkoutId=${encodeURIComponent(checkoutId)}`
          );
          const j = (await r.json()) as { ok?: boolean; status?: string };
          if (j.ok && j.status === "success") {
            setPhase("done");
            setState(true);
            setNote("Paid. Your ticket is confirmed.");
            router.refresh();
            return;
          }
          if (j.ok && j.status === "failed") {
            setPhase("error");
            setNote("Payment was cancelled or failed. You can try again.");
            return;
          }
        } catch {
          /* keep polling; a dropped request is not a failure */
        }
        if (tries > 0) {
          poll(checkoutId, tries - 1);
        } else {
          setPhase("error");
          setNote(
            "We did not get a confirmation in time. If you were charged, your ticket will appear shortly."
          );
        }
      }, 3000);
      timers.current.push(t);
    },
    [router]
  );

  async function payNow() {
    setPhase("sending");
    setNote("");
    try {
      const r = await fetch("/api/events/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, phone }),
      });
      const j = (await r.json()) as { ok?: boolean; reason?: string };
      if (!j.ok) {
        setPhase("error");
        const msg: Record<string, string> = {
          bad_phone: "That does not look like a Kenyan number. Use 07xx xxx xxx.",
          not_configured: "M-Pesa is not set up on this site yet.",
          already_booked: "You already have a ticket for this event.",
          sold_out: "This event just sold out.",
        };
        setNote(msg[j.reason || ""] || "Could not start the payment. Try again.");
        return;
      }
      setPhase("waiting");
      setNote("Check your phone and enter your M-Pesa PIN.");
      const checkoutId = (j as { checkoutId?: string }).checkoutId;
      if (checkoutId) poll(checkoutId, 20);
    } catch {
      setPhase("error");
      setNote("Network problem. Try again.");
    }
  }

  // ---- render ---------------------------------------------------------
  if (!state && full) {
    return (
      <button
        type="button"
        className="btn btn-primary book-btn"
        disabled
        style={{ flex: 1 }}
      >
        Sold out
      </button>
    );
  }

  if (state) {
    return (
      <button
        type="button"
        className="btn btn-primary book-btn booked"
        onClick={cancelBooking}
        disabled={busy}
        style={{ flex: 1 }}
      >
        {busy
          ? "..."
          : paid
            ? "Ticket confirmed \u2713"
            : "Booked \u2713 Tap to cancel"}
      </button>
    );
  }

  if (!paid) {
    return (
      <button
        type="button"
        className="btn btn-primary book-btn"
        onClick={toggleFree}
        disabled={busy}
        style={{ flex: 1 }}
      >
        {busy ? "..." : "RSVP - I'm going"}
      </button>
    );
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        className="btn btn-primary book-btn"
        onClick={openPhone}
        style={{ flex: 1 }}
      >
        {`Get ticket \u00b7 KSh ${priceKes.toLocaleString("en-KE")}`}
      </button>
    );
  }

  const pending = phase === "sending" || phase === "waiting";

  return (
    <div className="mpesa-pay" style={{ flex: 1 }}>
      <label className="mpesa-label" htmlFor={`mp-${eventId}`}>
        M-Pesa number
      </label>
      <div className="mpesa-row">
        <input
          id={`mp-${eventId}`}
          className="mpesa-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="07xx xxx xxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={pending}
        />
        <button
          type="button"
          className="btn btn-primary mpesa-go"
          onClick={payNow}
          disabled={pending || phone.trim().length < 9}
        >
          {phase === "sending"
            ? "Sending..."
            : phase === "waiting"
              ? "Waiting..."
              : `Pay ${priceKes.toLocaleString("en-KE")}`}
        </button>
      </div>
      {note ? (
        <p className={"mpesa-note" + (phase === "error" ? " err" : "")}>{note}</p>
      ) : (
        <p className="mpesa-note">
          You will get a prompt on your phone to approve the payment.
        </p>
      )}
    </div>
  );
}
