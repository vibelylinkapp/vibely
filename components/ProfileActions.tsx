"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "Fake profile",
  "Harassment or abuse",
  "Inappropriate content",
  "Scam or spam",
  "Underage user",
  "Other",
];

export default function ProfileActions({
  targetId,
  targetName,
}: {
  targetId: string;
  targetName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Portals need the DOM; only render into document.body once mounted.
  useEffect(() => setMounted(true), []);

  // Stop the page behind the modal from scrolling while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function submitReport() {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setBusy(false);
      return;
    }
    await supabase.from("reports").insert({
      reporter_id: data.user.id,
      reported_id: targetId,
      reason,
      detail: detail.trim() || null,
    });
    setBusy(false);
    setOpen(false);
    setDone(true);
  }

  async function block() {
    if (!window.confirm(`Block ${targetName}? You will not see each other.`))
      return;
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("blocks")
      .insert({ blocker_id: data.user.id, blocked_id: targetId });
    router.refresh();
  }

  if (done) {
    return (
      <div className="pcard-actions">
        <span style={{ fontSize: 12, color: "#22C55E" }}>Reported</span>
      </div>
    );
  }

  // The overlay is rendered through a portal to <body>. Cards apply a
  // transform on :hover, and a transformed ancestor becomes the containing
  // block for position:fixed descendants — which was pinning this modal to
  // the card and pushing it off the right edge of the screen. Portalling to
  // body guarantees the overlay is centered against the viewport instead.
  const overlay = (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Report {targetName}</h3>
        <select
          className="modal-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <textarea
          className="modal-input"
          rows={3}
          placeholder="Add any details (optional)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
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
            onClick={submitReport}
            disabled={busy}
          >
            {busy ? "Sending..." : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="pcard-actions">
        <button type="button" onClick={() => setOpen(true)}>
          Report
        </button>
        <button type="button" onClick={block}>
          Block
        </button>
      </div>

      {open && mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
