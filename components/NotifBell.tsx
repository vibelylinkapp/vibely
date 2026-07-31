"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotifBell() {
  const [unread, setUnread] = useState(0);
  const supabase = useRef(createClient()).current;

  const refetch = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setUnread(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const onWake = () => refetch();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [refetch]);

  useEffect(() => {
    const channel = supabase
      .channel("nav-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  return (
    <Link
      href="/notifications"
      className="appbar-btn notifs"
      aria-label="Notifications"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="appbar-badge" aria-label={`${unread} unread`}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
