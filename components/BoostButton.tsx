"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BoostButton({
  eligible,
  activeUntil: initialActive,
  remaining: initialRemaining,
}: {
  eligible: boolean;
  activeUntil: string | null;
  remaining: number | null;
}) {
  const router = useRouter();
  const [activeUntil, setActiveUntil] = useState<string | null>(initialActive);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!eligible) {
    return (
      <div className="boost-box">
        <div className="boost-head">
          <strong>Profile Boost</strong>
        </div>
        <span className="sub">
          Rise to the top of Discover for 30 minutes. Boosts are a Gold &amp;
          VIP perk.
        </span>
        <Link href="/upgrade" className="btn boost-cta">
          Get Gold
        </Link>
      </div>
    );
  }

  const isActive =
    activeUntil !== null && new Date(activeUntil).getTime() > Date.now();

  async function boost() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/boost", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        activeUntil?: string;
        remaining?: number | null;
        reason?: string;
      };
      if (!res.ok || !json.ok) {
        setError(
          json.reason === "quota_exceeded"
            ? "You've used all your boosts this month."
            : "Could not boost right now. Please try again."
        );
        setBusy(false);
        return;
      }
      setActiveUntil(json.activeUntil ?? null);
      if (typeof json.remaining === "number") setRemaining(json.remaining);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Could not boost right now. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="boost-box">
      <div className="boost-head">
        <strong>Profile Boost</strong>
      </div>
      {isActive ? (
        <span className="boost-active">
          Boosted until {fmtTime(activeUntil as string)} — you&apos;re at the top
          of Discover.
        </span>
      ) : (
        <>
          <span className="sub">
            Rise to the top of Discover for 30 minutes.
            {remaining !== null
              ? ` ${remaining} left this month.`
              : " Unlimited boosts."}
          </span>
          <button
            className="btn boost-cta"
            onClick={boost}
            disabled={busy || remaining === 0}
          >
            {busy
              ? "Boosting…"
              : remaining === 0
                ? "No boosts left"
                : "Boost my profile"}
          </button>
        </>
      )}
      {error && <p className="auth-msg">{error}</p>}
    </div>
  );
}
