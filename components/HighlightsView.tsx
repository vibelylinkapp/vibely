"use client";

import "@/app/highlights-plus.css";
import { useState } from "react";
import type { Highlight } from "@/lib/highlights";

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HighlightsView({
  highlights,
}: {
  highlights: Highlight[];
}) {
  const [active, setActive] = useState<number | null>(null);

  if (highlights.length === 0) return null;

  const open = active !== null ? highlights[active] : null;

  function go(delta: number) {
    setActive((cur) => {
      if (cur === null) return cur;
      const next = cur + delta;
      if (next < 0 || next >= highlights.length) return cur;
      return next;
    });
  }

  return (
    <>
      <div className="hl-row hl-row-view">
        {highlights.map((it, i) => (
          <button
            type="button"
            className="hl-item hl-item-btn"
            key={it.id}
            onClick={() => setActive(i)}
          >
            <span className="hl-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.media_url} alt={it.title} />
            </span>
            <span className="hl-title">{it.title}</span>
          </button>
        ))}
      </div>

      {open && active !== null && (
        <div
          className="hl-view"
          role="dialog"
          aria-label={open.title}
          onClick={() => setActive(null)}
        >
          <button
            className="hl-view-close"
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            ×
          </button>
          {active > 0 && (
            <button
              className="hl-view-nav prev"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous"
            >
              <Chevron dir="prev" />
            </button>
          )}
          <figure className="hl-view-body" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hl-view-img" src={open.media_url} alt={open.title} />
            <figcaption className="hl-view-cap">
              <strong>{open.title}</strong>
              {open.caption && <span>{open.caption}</span>}
            </figcaption>
          </figure>
          {active < highlights.length - 1 && (
            <button
              className="hl-view-nav next"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next"
            >
              <Chevron dir="next" />
            </button>
          )}
          <div className="hl-view-dots">
            {highlights.map((h, i) => (
              <span
                key={h.id}
                className={"hl-dot" + (i === active ? " on" : "")}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
