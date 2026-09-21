"use client";

import { useState } from "react";
import { forDisplay } from "@/lib/phone";
import { savePayoutNumber } from "@/app/(app)/profile/payout-actions";

export default function PayoutSetup({
  initialNumber,
  initialStatus,
}: {
  initialNumber: string | null;
  initialStatus: string | null;
}) {
  const [num, setNum] = useState(forDisplay(initialNumber));
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await savePayoutNumber(num);
    setBusy(false);
    setErr(!res.ok);
    setMsg(res.message);
    if (res.status) setStatus(res.status);
  }

  return (
    <div className="fld">
      <span className="fld-l">
        Payout number (for events you host)
        {status === "active" ? " -- active" : ""}
      </span>
      <div className="mpesa-row">
        <input
          className="mpesa-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="07xx xxx xxx"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          disabled={busy}
        />
        <button
          type="button"
          className="btn btn-primary mpesa-go"
          onClick={save}
          disabled={busy || num.trim().length < 9}
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
      <p className={"mpesa-note" + (err ? " err" : "")}>
        {msg ??
          "Money from your ticket sales is sent straight to this M-Pesa number. Vibely keeps a 10% commission and never holds your share."}
      </p>
    </div>
  );
}
