"use client";

import { useState } from "react";

export default function SendSummaryButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/summary", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; sent?: number };
      if (!res.ok || !json.ok) {
        setMsg("Could not send. Please try again.");
      } else if ((json.sent ?? 0) === 0) {
        setMsg(
          "Digest ready, but no admin devices are registered for push yet. Enable notifications on your profile first."
        );
      } else {
        setMsg(
          `Sent to ${json.sent} ${json.sent === 1 ? "device" : "devices"}.`
        );
      }
    } catch {
      setMsg("Could not send. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="alerts-send">
      <button className="btn" onClick={send} disabled={busy}>
        {busy ? "Sending\u2026" : "Send summary to my devices now"}
      </button>
      {msg && <p className="stat-hint">{msg}</p>}
    </div>
  );
}
