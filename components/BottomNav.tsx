"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/liked-you", label: "Likes" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const supabase = useRef(createClient()).current;

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

  // Refetch on navigation — also clears the badge after a thread is opened.
  useEffect(() => {
    refetch();
  }, [path, refetch]);

  // Refetch when the tab regains focus / visibility.
  useEffect(() => {
    const onWake = () => refetch();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [refetch]);

  // Live-update when a message lands in any of my conversations (RLS scopes
  // the stream to threads I'm a member of).
  useEffect(() => {
    const channel = supabase
      .channel("nav-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        const showBadge = it.href === "/messages" && unread > 0;
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <span className="nav-label">
              {it.label}
              {showBadge && (
                <span className="nav-badge" aria-label={`${unread} unread`}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
