"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CheckInForm({
  userId,
  county,
  triggerClass,
  triggerContent,
}: {
  userId: string;
  county: string | null;
  triggerClass?: string;
  triggerContent?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!place.trim()) {
      setError("Where are you right now?");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: insErr } = await supabase.from("checkins").insert({
      profile_id: userId,
      place: place.trim(),
      area: area.trim() || null,
      county: county,
      note: note.trim() || null,
    });
    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setPlace("");
    setArea("");
    setNote("");
    setOpen(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass ?? "btn"}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? "Drop a live check-in"}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Drop a live check-in</h3>
            <p className="modal-sub">
              Show you&apos;re out and open to meet. Check-ins disappear after 4
              hours.
            </p>
            <input
              className="modal-input"
              placeholder="Where are you? (e.g. Java House, Kilimani)"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <input
              className="modal-input"
              placeholder="Area / neighbourhood (e.g. Kilimani, Karen, Thika)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <textarea
              className="modal-input"
              rows={2}
              placeholder="What's the vibe? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
                {busy ? "Dropping..." : "Go live"}
              </button>
            </div>
            {error && <p className="auth-msg">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
