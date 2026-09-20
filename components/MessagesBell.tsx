"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/**
 * Unread-messages link for the Home header.
 *
 * Chats left the bottom nav (Events took the slot), so this keeps
 * /messages one tap away and carries the unread badge that used to live
 * on the tab. Same /api/unread endpoint BottomNav used.
 */
export default function MessagesBell() {
  const [unread, setUnread] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/unread", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { count?: number };
      setUnread(typeof json.count === "number" ? json.count : 0);
    } catch {
      /* best-effort badge; ignore transient errors */
    }
  }, []);

  useEffect(() => {
    refetch();
    const onWake = () => refetch();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    const id = window.setInterval(refetch, 60000);
    return () => {
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
      window.clearInterval(id);
    };
  }, [refetch]);

  return (
    <Link
      href="/messages"
      className="appbar-btn msgs"
      aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.3 5.7-.1.8-.5 2-1.4 3.2 1.8-.3 3.4-1.2 4.4-2 .9.2 1.8.3 2.7.3 5 0 9-3.3 9-7.2S17 3 12 3z" />
      </svg>
      {unread > 0 && (
        <span className="appbar-badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
