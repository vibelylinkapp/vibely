"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const star = (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <path
      d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.8 6.8 20l1-5.8L3.5 9.2l5.9-.9z"
      fill="currentColor"
    />
  </svg>
);

export default function FeedbackForm({ userId }: { userId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (!message.trim()) {
      setError("Tell us a little about your experience.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: dbErr } = await supabase.from("feedback").insert({
      profile_id: userId,
      rating,
      message: message.trim(),
    });
    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="fb-done">
        <strong>Thank you</strong>
        <span className="sub">
          We read every message — your feedback helps make Vibely better.
        </span>
      </div>
    );
  }

  return (
    <div className="fb-form">
      <div className="fb-rating" role="group" aria-label="Rate your experience">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={"fb-star" + (rating !== null && n <= rating ? " on" : "")}
            onClick={() => setRating(n)}
            aria-label={`${n} out of 5`}
          >
            {star}
          </button>
        ))}
      </div>
      <textarea
        className="fb-text"
        rows={5}
        maxLength={1000}
        placeholder="What do you love? What's frustrating? What would make Vibely better?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="auth-msg">{error}</p>}
      <button type="button" className="btn" onClick={submit} disabled={busy}>
        {busy ? "Sending..." : "Send feedback"}
      </button>
    </div>
  );
}
