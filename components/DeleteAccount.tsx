"use client";

import Link from "next/link";
import { useState } from "react";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccount({
  hasActivePlan = false,
}: {
  hasActivePlan?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = confirm.trim().toUpperCase() === CONFIRM_PHRASE;

  async function remove() {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm, reason }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!json.ok) {
        setError(
          json.error === "confirmation_required"
            ? `Type ${CONFIRM_PHRASE} exactly to confirm.`
            : "We could not delete your account just now. Please try again, or email hello@vibely.co.ke and we will do it for you."
        );
        setBusy(false);
        return;
      }

      // Full reload rather than a router push: every cached server component
      // still holds data for an account that no longer exists.
      window.location.href = "/?deleted=1";
    } catch {
      setError(
        "Something went wrong. Please try again, or email hello@vibely.co.ke."
      );
      setBusy(false);
    }
  }

  return (
    <section className="danger">
      <h3 className="danger-h">Delete account</h3>

      {!open ? (
        <>
          <p className="danger-lead">
            Permanently delete your Vibely account and everything on it. This
            cannot be undone.
          </p>
          <button
            type="button"
            className="danger-open"
            onClick={() => setOpen(true)}
          >
            Delete my account
          </button>
        </>
      ) : (
        <div className="danger-panel">
          <p className="danger-lead">
            <strong>This is permanent.</strong> We delete your profile, photos,
            stories, posts, messages, matches, plans and event bookings
            straight away. You cannot sign back in and we cannot restore it.
          </p>

          <p className="danger-keep">
            We keep two things, and only these: payment records, because tax
            law requires it, and reports made about your account, so someone
            removed for abuse cannot immediately return. Both are explained in
            the <Link href="/privacy">privacy policy</Link>.
          </p>

          {hasActivePlan && (
            <p className="danger-warn">
              You have paid time remaining. Deleting now forfeits it — there is
              no refund for the unused days.
            </p>
          )}

          <label className="danger-field">
            <span>Why are you leaving? (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="This helps us fix what is not working."
            />
          </label>

          <label className="danger-field">
            <span>
              Type <b>{CONFIRM_PHRASE}</b> to confirm
            </span>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={CONFIRM_PHRASE}
            />
          </label>

          {error && <p className="danger-error">{error}</p>}

          <div className="danger-actions">
            <button
              type="button"
              className="danger-cancel"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setReason("");
                setError(null);
              }}
              disabled={busy}
            >
              Keep my account
            </button>
            <button
              type="button"
              className="danger-go"
              onClick={remove}
              disabled={!armed || busy}
            >
              {busy ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
