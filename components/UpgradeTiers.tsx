"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, TIER_RANK, type PaidTier } from "@/lib/tiers";

export default function UpgradeTiers({
  currentTier,
  currentStatus,
  expiresAt,
}: {
  currentTier: string;
  currentStatus: string;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busyTier, setBusyTier] = useState<PaidTier | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const rank = TIER_RANK[currentTier] ?? 0;
  const isActive = currentTier !== "free" && currentStatus === "active";

  async function pay(tier: PaidTier) {
    setError(null);
    if (!phone.trim()) {
      setError("Enter your M-Pesa phone number first.");
      return;
    }
    setBusyTier(tier);
    setStatus("Sending a payment prompt to your phone…");

    let json: { ok?: boolean; checkoutId?: string; reason?: string };
    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, phone }),
      });
      json = await res.json();
      if (!res.ok || !json.ok || !json.checkoutId) {
        throw new Error(json.reason || "Could not start the payment.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start payment.";
      setError(
        msg === "not_configured"
          ? "M-Pesa payments aren't switched on yet. Please check back soon."
          : msg
      );
      setBusyTier(null);
      setStatus(null);
      return;
    }

    setStatus("Check your phone and enter your M-Pesa PIN to confirm…");
    const checkoutId = json.checkoutId;
    let tries = 0;

    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const s = await fetch(
          `/api/mpesa/status?checkoutId=${encodeURIComponent(checkoutId)}`
        );
        const sj = (await s.json()) as { ok?: boolean; status?: string };
        if (sj.ok && sj.status === "success") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus(`Payment received — welcome to ${tier.toUpperCase()}!`);
          setBusyTier(null);
          router.refresh();
        } else if (sj.ok && sj.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("The payment was cancelled or failed. Please try again.");
          setBusyTier(null);
          setStatus(null);
        } else if (tries >= 24) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus(
            "Still waiting for confirmation. If you completed the payment, your tier will update shortly."
          );
          setBusyTier(null);
        }
      } catch {
        // transient network error — keep polling until the tries cap
      }
    }, 5000);
  }

  return (
    <section className="upgrade">
      {isActive && (
        <div className="upgrade-current">
          You&apos;re on <strong>{currentTier.toUpperCase()}</strong>
          {expiresAt
            ? ` · renews ${new Date(expiresAt).toLocaleDateString()}`
            : ""}
        </div>
      )}

      <label className="upgrade-phone">
        <span>M-Pesa phone number</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          inputMode="tel"
          autoComplete="tel"
        />
      </label>

      {status && <p className="upgrade-status">{status}</p>}
      {error && <p className="auth-msg">{error}</p>}

      <div className="tier-grid">
        {TIERS.map((t) => {
          const owned = isActive && TIER_RANK[t.id] <= rank;
          return (
            <div className={"tier-card tier-" + t.id} key={t.id}>
              <div className="tier-name">{t.name}</div>
              <div className="tier-price">
                KES {t.price.toLocaleString()}
                <span>/mo</span>
              </div>
              <ul className="tier-perks">
                {t.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <button
                className="btn"
                disabled={busyTier !== null || owned}
                onClick={() => pay(t.id)}
              >
                {owned
                  ? "Included"
                  : busyTier === t.id
                    ? "Waiting…"
                    : "Pay with M-Pesa"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="upgrade-note">
        You&apos;ll receive an M-Pesa prompt on your phone — enter your PIN to
        confirm. Subscriptions last {30} days. Your number is only used for this
        payment.
      </p>
    </section>
  );
}
