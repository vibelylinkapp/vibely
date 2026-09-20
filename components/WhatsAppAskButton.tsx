"use client";

import { useState, type MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "none" | "pending" | "approved" | "declined";

function waLink(num: string): string {
  return "https://wa.me/" + num.replace(/[^\d]/g, "");
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Z" />
    </svg>
  );
}

/**
 * Compact version of WhatsAppShare for use inside cards.
 *
 * WhatsAppShare is a full panel with request, approve and reveal states,
 * which is right on a profile but far too tall in a grid cell. This is the
 * same flow reduced to a single button, using the same three RPCs.
 *
 * It can sit inside a card that is itself a <Link>, so every handler stops
 * propagation - otherwise tapping the button would navigate instead.
 */
export default function WhatsAppAskButton({
  otherId,
  otherName,
  outgoing: outInit = "none",
}: {
  otherId: string;
  otherName: string;
  outgoing?: Status;
}) {
  const [outgoing, setOutgoing] = useState<Status>(outInit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = otherName.split(" ")[0];

  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function ask(e: MouseEvent) {
    stop(e);
    setBusy(true);
    setError(null);
    const { data, error: err } = await createClient().rpc("request_whatsapp", {
      other_id: otherId,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOutgoing(((data as Status) || "pending") as Status);
  }

  async function open(e: MouseEvent) {
    stop(e);
    setBusy(true);
    setError(null);
    const { data, error: err } = await createClient().rpc(
      "get_shared_whatsapp",
      { other_id: otherId }
    );
    setBusy(false);
    if (err || typeof data !== "string" || !data) {
      setError("No number shared yet.");
      return;
    }
    window.open(waLink(data), "_blank", "noopener,noreferrer");
  }

  if (outgoing === "approved") {
    return (
      <button type="button" className="wa-ask on" onClick={open} disabled={busy}>
        <WaIcon />
        {busy ? "Opening…" : "WhatsApp"}
      </button>
    );
  }

  if (outgoing === "pending") {
    return (
      <span className="wa-ask is-wait" aria-live="polite">
        <WaIcon />
        Asked {first}
      </span>
    );
  }

  if (outgoing === "declined") {
    // Deliberately terminal. 0032 keeps a decline final, so there is no
    // "ask again" affordance here either.
    return (
      <span className="wa-ask is-off">
        <WaIcon />
        Not shared
      </span>
    );
  }

  return (
    <>
      <button type="button" className="wa-ask" onClick={ask} disabled={busy}>
        <WaIcon />
        {busy ? "Asking…" : "Ask for WhatsApp"}
      </button>
      {error && <span className="wa-ask-err">{error}</span>}
    </>
  );
}
