"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// Shown on a profile you haven't matched with yet. Messaging opens once the
// like is mutual (that path is handled by LikeButton's matched state), so here
// we explain how to connect and — for free members — why upgrading helps them
// match faster.
export default function MessageConnect({
  targetName,
  viewerIsPaid,
}: {
  targetName: string;
  viewerIsPaid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need the DOM; only render into document.body once mounted.
  useEffect(() => setMounted(true), []);

  // Stop the page behind the modal from scrolling while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const firstName = targetName.split(" ")[0];

  const overlay = (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Message {firstName}</h3>
        <p className="sub" style={{ marginTop: 4 }}>
          Chat opens as soon as you and {firstName} both like each other. Tap
          Like to send your interest — the moment it&apos;s mutual you can
          message right here.
        </p>
        {!viewerIsPaid && (
          <p className="sub" style={{ marginTop: 10 }}>
            In a hurry? <strong>Vibely Plus</strong> shows you who already likes
            you and unlocks unlimited likes, so you match and start chatting
            faster.
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setOpen(false)}
          >
            Got it
          </button>
          {!viewerIsPaid && (
            <Link href="/upgrade" className="btn">
              See Vibely Plus
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="pcard-msg"
        onClick={() => setOpen(true)}
      >
        Message
      </button>

      {open && mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
