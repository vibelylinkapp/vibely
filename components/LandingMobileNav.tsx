"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#explore", label: "Explore" },
  { href: "/#story", label: "Our story" },
  { href: "/about", label: "About" },
  { href: "/safety", label: "Safety" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={"lp2-burger" + (open ? " is-open" : "")}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="lp2-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={"lp2-menu" + (open ? " is-open" : "")}
        id="lp2-menu"
        hidden={!open}
      >
        <button
          type="button"
          className="lp2-menu-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <nav className="lp2-menu-panel" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="lp2-menu-cta">
            <Link
              href="/sign-in"
              className="lp2-login"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/sign-in"
              className="btn lp2-btn-sm"
              onClick={() => setOpen(false)}
            >
              Join free
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
