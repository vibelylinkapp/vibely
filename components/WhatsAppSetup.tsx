"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WhatsAppSetup({
  userId,
  initial,
}: {
  userId: string;
  initial: string | null;
}) {
  const [num, setNum] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: dbErr } = await supabase.from("member_contacts").upsert({
      profile_id: userId,
      whatsapp: num.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="verify-box wa-setup">
      <div className="verify-head">
        <strong>WhatsApp number</strong>
      </div>
      <span className="sub">
        Shared only with matches who ask — and only after you approve. It is
        never shown on your profile.
      </span>
      <input
        className="modal-input"
        type="tel"
        inputMode="tel"
        placeholder="e.g. 0712 345 678"
        value={num}
        onChange={(e) => {
          setNum(e.target.value);
          setSaved(false);
        }}
      />
      {error && <p className="auth-msg">{error}</p>}
      <button
        type="button"
        className="btn"
        onClick={save}
        disabled={busy}
        style={{ marginTop: 10 }}
      >
        {busy ? "Saving..." : saved ? "Saved" : "Save number"}
      </button>
    </div>
  );
}
