"use client";

import { useState, useTransition } from "react";
import { saveWhatsAppNumber } from "@/app/(app)/profile/actions";
import { forDisplay } from "@/lib/phone";

export default function WhatsAppSetup({
  initial,
}: {
  initial: string | null;
}) {
  const [num, setNum] = useState(forDisplay(initial));
  const [savedValue, setSavedValue] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = num.trim() !== forDisplay(savedValue).trim();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveWhatsAppNumber(num);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedValue(res.value);
      setNum(forDisplay(res.value));
    });
  }

  return (
    <div className="verify-box wa-setup">
      <div className="verify-head">
        <strong>WhatsApp number</strong>
        {savedValue && !dirty && <span className="wa-ok">Saved</span>}
      </div>
      <span className="sub">
        Shared only with matches who ask — and only after you approve. It is
        never shown on your profile.
      </span>
      <input
        className="modal-input"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="e.g. 0712 345 678"
        value={num}
        onChange={(e) => {
          setNum(e.target.value);
          setError(null);
        }}
      />
      {error && <p className="auth-msg">{error}</p>}
      <button
        type="button"
        className="btn"
        onClick={save}
        disabled={pending || !dirty}
        style={{ marginTop: 10 }}
      >
        {pending ? "Saving..." : dirty ? "Save number" : "Saved"}
      </button>
    </div>
  );
}
