"use client";

import { useState } from "react";

// Self-profile "Share profile" button. Uses the Web Share sheet when available
// and falls back to copying the public profile link to the clipboard. Purely
// client-side — no props beyond the member id used to build the /u/[id] link.
export default function ShareProfile({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/u/${userId}`
        : `/u/${userId}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "My Vibely profile", url });
        return;
      }
    } catch {
      // Share sheet dismissed or unavailable — fall through to clipboard.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — nothing else to do.
    }
  }

  return (
    <button type="button" className="pf4-sharebtn" onClick={share}>
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
