"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Snooze the nudge for a few days when dismissed so it keeps reminding
// unverified members without nagging on every single visit.
const KEY = "vibely.verifyNudge.snoozedUntil";
const SNOOZE_MS = 3 * 86400000;

export default function VerifyNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(KEY) ?? 0);
      setShow(Date.now() > until);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function snooze() {
    try {
      localStorage.setItem(KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      // ignore
    }
    setShow(false);
  }

  return (
    <div className="verify-nudge">
      <span className="vn-ic" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FFB020" />
          <path
            d="M7 12.5l3 3 7-7"
            fill="none"
            stroke="#12151D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="vn-body">
        <strong>Get verified</strong>
        <span>Add your badge — verified profiles get more likes and trust.</span>
      </div>
      <Link href="/verify" className="vn-cta">
        Verify
      </Link>
      <button
        type="button"
        className="vn-x"
        onClick={snooze}
        aria-label="Remind me later"
      >
        ×
      </button>
    </div>
  );
}
