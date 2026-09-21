"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEATURES } from "@/lib/features";

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11 12 3l9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4-4" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
} as const;

type TabKey = keyof typeof ICONS;

// WhatsApp is the conversation layer, so the Chats slot goes to Events -
// the reason most people open this app on a Friday. /messages still works
// and sits in the Home header (MessagesBell), badge included. Set
// NEXT_PUBLIC_FEATURE_CHAT_TAB=1 to put Chats back in the bar.
const TABS: { href: string; label: string; key: TabKey }[] = [
  { href: "/home", label: "Home", key: "home" },
  { href: "/discover", label: "Discover", key: "discover" },
  FEATURES.chatTab
    ? { href: "/messages", label: "Chats", key: "messages" as TabKey }
    : { href: "/events", label: "Events", key: "events" as TabKey },
  { href: "/profile", label: "Profile", key: "profile" },
];

/**
 * Routes that deliberately have no tab bar. Before the shared layout each
 * page opted IN by rendering the bar itself, so these three simply never
 * did. Now that the shell renders it once, they opt out here instead --
 * same result, one place to look.
 */
const NAV_HIDDEN_EXACT = new Set(["/onboarding"]);
const NAV_HIDDEN_DETAIL = /^\/(messages|events)\/[^/]+$/;

function navHidden(pathname: string): boolean {
  return NAV_HIDDEN_EXACT.has(pathname) || NAV_HIDDEN_DETAIL.test(pathname);
}

export default function BottomNav() {
  const path = usePathname();
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
  }, [path, refetch]);

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
    // Created HERE rather than during render. This component now lives in
    // the signed-in layout, and layouts are prerendered, so a render-time
    // createClient() would construct a browser Supabase client on the
    // server for every signed-in page -- and fail outright at build time
    // wherever NEXT_PUBLIC_SUPABASE_* is absent. The client is only needed
    // for this realtime subscription, so it belongs in the effect.
    const supabase = createClient();
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
  }, [refetch]);

  // Must sit below every hook above: bailing out earlier would change hook
  // order between routes and crash React.
  if (navHidden(path)) return null;

  const isActive = (href: string) =>
    path === href || path.startsWith(href + "/");

  const renderTab = (t: (typeof TABS)[number]) => {
    const active = isActive(t.href);
    const showBadge = t.href === "/messages" && unread > 0;
    return (
      <Link
        key={t.href}
        href={t.href}
        className={active ? "bn-tab active" : "bn-tab"}
        aria-label={t.label}
        aria-current={active ? "page" : undefined}
      >
        <span className="bn-icon">
          {ICONS[t.key]}
          {showBadge && (
            <span className="bn-badge" aria-label={`${unread} unread`}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className="bn-label">{t.label}</span>
      </Link>
    );
  };

  const createActive = isActive("/create");

  return (
    <nav className="bottomnav">
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}
      <Link
        href="/create"
        className={createActive ? "bn-tab bn-create active" : "bn-tab bn-create"}
        aria-label="Create"
      >
        <span className="bn-plus">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </Link>
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </nav>
  );
}
