"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TIER_LABEL: Record<string, string> = {
  plus: "Plus",
  gold: "Gold",
  vip: "VIP",
};

// Per-day dismissal key so the nudge can reappear the next day if still relevant.
function dismissKey(state: string): string {
  const d = new Date();
  return `vibely_winback:${state}:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function WinbackBanner({
  state,
  tier,
  days,
}: {
  state: "expiring" | "lapsed";
  tier: string;
  days: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissKey(state)) === "1") setVisible(false);
    } catch {
      // localStorage unavailable — just show the banner.
    }
  }, [state]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(dismissKey(state), "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  const label = TIER_LABEL[tier] ?? "membership";
  const title =
    state === "expiring"
      ? `Your Vibely ${label} ends ${days <= 1 ? "tomorrow" : `in ${days} days`}`
      : `Your Vibely ${label} has expired`;
  const body =
    state === "expiring"
      ? "Renew now to keep seeing who likes you, your boosts, and the rest of your perks."
      : `You lost your perks ${
          days <= 1 ? "yesterday" : `${days} days ago`
        }. Reactivate to pick up right where you left off.`;
  const cta = state === "expiring" ? "Renew now" : "Reactivate";

  return (
    <div className={"winback" + (state === "lapsed" ? " winback-lapsed" : "")}>
      <div className="winback-text">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      <div className="winback-actions">
        <Link href="/upgrade" className="btn winback-cta">
          {cta}
        </Link>
        <button className="winback-x" onClick={dismiss} aria-label="Dismiss">
          &times;
        </button>
      </div>
    </div>
  );
}
