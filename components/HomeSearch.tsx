"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Real search box for Home. Typing + submit navigates to Discover with a
// query string, which Discover reads (?q=) to filter people by name.
export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/discover?q=${encodeURIComponent(term)}` : "/discover");
  }

  return (
    <form className="home-search" onSubmit={submit} role="search">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4-4" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search people by name"
        aria-label="Search people"
        enterKeyHint="search"
      />
      <button type="submit" className="home-search-go" aria-label="Search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
