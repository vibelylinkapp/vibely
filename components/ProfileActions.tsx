"use client";

import { useState } from "react";
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
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

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

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
      )}
    </>
  );
}
