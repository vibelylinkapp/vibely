"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, TIER_RANK, type PaidTier } from "@/lib/tiers";

// Local copy of the Daraja phone normaliser so we can validate the number
// before hitting the server (lib/mpesa is server-only). Returns Daraja's
// 2547XXXXXXXX / 2541XXXXXXXX form, or null when it isn't a valid KE mobile.
function normalizeKePhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.startsWith("254")) {
    // already prefixed
  } else if (d.startsWith("7") || d.startsWith("1")) d = "254" + d;
  if (!/^254(7|1)\d{8}$/.test(d)) return null;
  return d;
}

const MAX_POLLS = 24; // 24 x 5s = ~2 minutes

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
  // The tier to re-attempt when a prompt times out or fails, so the member
  // can resend without re-picking a plan.
  const [retryTier, setRetryTier] = useState<PaidTier | null>(null);
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
    setRetryTier(null);

    // Validate the number up front so a typo fails instantly with clear
    // guidance instead of a slow round-trip to Daraja.
    const normalized = normalizeKePhone(phone);
    if (!normalized) {
      setError("Enter a valid Kenyan M-Pesa number, e.g. 0712 345 678.");
      return;
    }

    if (pollRef.current) clearInterval(pollRef.current);
    setBusyTier(tier);
    setStatus(`Sending a payment request to ${normalized}...`);

    let json: { ok?: boolean; checkoutId?: string; reason?: string };
    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, phone: normalized }),
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
          : msg === "bad_phone"
            ? "That number didn't work. Check it and try again, e.g. 0712 345 678."
            : msg
      );
      setBusyTier(null);
      setStatus(null);
      setRetryTier(tier);
      return;
    }

    setStatus(
      "Check your phone and enter your M-Pesa PIN to confirm. The prompt can take up to a minute to arrive — keep this page open."
    );
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
          setRetryTier(null);
          router.refresh();
        } else if (sj.ok && sj.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("The payment was cancelled or failed. Please try again.");
          setBusyTier(null);
          setStatus(null);
          setRetryTier(tier);
        } else if (tries >= MAX_POLLS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus(
            "We haven't seen a confirmation yet. If you already completed the payment, your tier will update automatically once it clears. Otherwise, resend the prompt below."
          );
          setBusyTier(null);
          setRetryTier(tier);
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

      {retryTier && busyTier === null && (
        <button
          type="button"
          className="btn"
          style={{ marginTop: 4 }}
          onClick={() => pay(retryTier)}
        >
          Resend M-Pesa prompt
        </button>
      )}

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
                    ? "Waiting..."
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
