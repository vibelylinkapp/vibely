"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "vibely.notice.dismissed";

const megaphone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" />
    <path d="M14 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14" />
  </svg>
);

export default function AdminNotice({
  id,
  body,
  link,
}: {
  id: string;
  body: string;
  link: string | null;
}) {
  // Render nothing until we know this notice wasn't already dismissed on
  // this device, so a dismissed banner never flashes on load.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(DISMISS_KEY) !== id);
    } catch {
      setShow(true);
    }
  }, [id]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, id);
    } catch {
      // ignore storage failures — worst case the banner reappears next load
    }
    setShow(false);
  }

  const isExternal = link ? /^https?:\/\//i.test(link) : false;

  const inner = (
    <>
      <span className="notice-ic">{megaphone}</span>
      <span className="notice-text">{body}</span>
      {link && <span className="notice-cta">Open</span>}
    </>
  );

  return (
    <div className="admin-notice">
      {link ? (
        isExternal ? (
          <a
            href={link}
            className="notice-main"
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        ) : (
          <Link href={link} className="notice-main">
            {inner}
          </Link>
        )
      ) : (
        <span className="notice-main notice-static">{inner}</span>
      )}
      <button
        type="button"
        className="notice-x"
        onClick={dismiss}
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </div>
  );
}
