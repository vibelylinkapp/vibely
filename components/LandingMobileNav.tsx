"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * The mobile menu for the landing page.
 *
 * It mirrors the desktop nav exactly — same sections, same order — because
 * the page is now one responsive tree rather than two divergent ones. It also
 * carries the legal links, which are otherwise only reachable by scrolling to
 * the footer.
 */
const SECTIONS = [
  { href: "/#explore", label: "Explore" },
  { href: "/#why", label: "Why Vibely" },
  { href: "/#how", label: "How it works" },
  { href: "/#safety", label: "Safety" },
  { href: "/#story", label: "Our story" },
];

const PAGES = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel so a keyboard or screen-reader user is not
    // left behind at the button while the rest of the page is inert.
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      // Simple focus trap: keep Tab cycling inside the open panel.
      const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={"lp-burger" + (open ? " is-open" : "")}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="lp-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="lp-menu" id="lp-menu">
          <button
            type="button"
            className="lp-menu-scrim"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
          />
          <nav className="lp-menu-panel" aria-label="Main" ref={panelRef}>
            {SECTIONS.map((l) => (
              <Link key={l.href} href={l.href} onClick={close}>
                {l.label}
              </Link>
            ))}
            {PAGES.map((l) => (
              <Link key={l.href} href={l.href} onClick={close}>
                {l.label}
              </Link>
            ))}
            <div className="lp-menu-cta">
              <Link
                href="/sign-in"
                className="lp-btn lp-btn--ghost"
                onClick={close}
              >
                Log in
              </Link>
              <Link
                href="/sign-in"
                className="lp-btn lp-btn--primary"
                onClick={close}
              >
                Join free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
