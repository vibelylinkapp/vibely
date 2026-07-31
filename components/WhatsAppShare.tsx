"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "none" | "pending" | "approved" | "declined";

function waLink(num: string): string {
  let d = num.replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  return "https://wa.me/" + d;
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 0 1 12 4zm-2.4 3.6c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.6 2 .8 2.5.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.5-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.3-.4-.5-.4z" />
    </svg>
  );
}

export default function WhatsAppShare({
  otherId,
  otherName,
  outgoing: outInit,
  incoming: inInit,
}: {
  otherId: string;
  otherName: string;
  outgoing: Status;
  incoming: Status;
}) {
  const [outgoing, setOutgoing] = useState<Status>(outInit);
  const [incoming, setIncoming] = useState<Status>(inInit);
  const [number, setNumber] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = otherName.split(" ")[0];

  async function request() {
    setBusy(true);
    setError(null);
    const { data, error: e } = await createClient().rpc("request_whatsapp", {
      other_id: otherId,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setOutgoing((data as Status) ?? "pending");
  }

  async function respond(approve: boolean) {
    setBusy(true);
    setError(null);
    const { error: e } = await createClient().rpc("respond_whatsapp", {
      from_id: otherId,
      approve,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setIncoming(approve ? "approved" : "declined");
  }

  async function reveal() {
    setBusy(true);
    setError(null);
    const { data, error: e } = await createClient().rpc("get_shared_whatsapp", {
      other_id: otherId,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setNumber((data as string | null) ?? "");
  }

  return (
    <div className="wa-share">
      {incoming === "pending" && (
        <div className="wa-incoming">
          <span className="wa-incoming-t">
            {first} wants your WhatsApp number
          </span>
          <div className="wa-actions">
            <button
              type="button"
              className="wa-btn wa-btn-approve"
              onClick={() => respond(true)}
              disabled={busy}
            >
              Share
            </button>
            <button
              type="button"
              className="wa-btn"
              onClick={() => respond(false)}
              disabled={busy}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {number !== null ? (
        number ? (
          <a
            className="wa-reveal"
            href={waLink(number)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WaIcon /> {number}
          </a>
        ) : (
          <span className="wa-muted">
            {first} hasn&apos;t added a WhatsApp number yet.
          </span>
        )
      ) : outgoing === "approved" ? (
        <button
          type="button"
          className="wa-btn wa-btn-wide"
          onClick={reveal}
          disabled={busy}
        >
          {busy ? "..." : "Reveal WhatsApp number"}
        </button>
      ) : outgoing === "pending" ? (
        <span className="wa-muted">
          WhatsApp requested — waiting for {first}
        </span>
      ) : outgoing === "declined" ? (
        <span className="wa-muted">WhatsApp request declined</span>
      ) : (
        <button
          type="button"
          className="wa-btn wa-btn-wide"
          onClick={request}
          disabled={busy}
        >
          {busy ? "..." : "Ask for WhatsApp number"}
        </button>
      )}

      {error && <p className="auth-msg wa-err">{error}</p>}
    </div>
  );
}
