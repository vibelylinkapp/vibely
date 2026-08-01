"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type NotifRow = {
  id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  link: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string | null; avatar_url: string | null } | null;
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function line(n: NotifRow): string {
  const who = n.actor?.display_name || "Someone";
  switch (n.type) {
    case "match":
      return `You matched with ${who}. Say hi!`;
    case "follow":
      return `${who} started following you`;
    case "post_like":
      return `${who} liked your post`;
    case "post_comment":
      return `${who} commented: ${n.body ?? ""}`.trim();
    case "plan_join":
      return `${who} joined your plan${n.body ? ` "${n.body}"` : ""}`;
    case "event_approved":
      return `Your event${n.body ? ` "${n.body}"` : ""} was approved and is now live`;
    case "event_rejected":
      return `Your event was not approved${n.body ? `: ${n.body}` : ""}`;
    default:
      return `${who} sent you an update`;
  }
}

function Avatar({ n }: { n: NotifRow }) {
  const system = n.type === "event_approved" || n.type === "event_rejected";
  if (system) {
    return <div className="notif-av notif-av-sys">V</div>;
  }
  const url = n.actor?.avatar_url;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="notif-av" src={url} alt="" />;
  }
  const initial = (n.actor?.display_name || "?").slice(0, 1).toUpperCase();
  return <div className="notif-av notif-av-fallback">{initial}</div>;
}

export default function NotificationsView({ initial }: { initial: NotifRow[] }) {
  const [rows] = useState<NotifRow[]>(initial);
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    const unreadIds = initial.filter((r) => !r.read_at).map((r) => r.id);
    if (unreadIds.length === 0) return;
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .then(() => {});
  }, [initial]);

  if (rows.length === 0) {
    return (
      <p className="nb-note">
        No notifications yet. Likes, follows, comments, matches and event updates will
        show up here.
      </p>
    );
  }

  return (
    <div className="notif-list">
      {rows.map((n) => {
        const inner = (
          <>
            <Avatar n={n} />
            <div className="notif-main">
              <span className="notif-text">{line(n)}</span>
              <span className="notif-time">{timeAgo(n.created_at)}</span>
            </div>
            {!n.read_at && <span className="notif-dot" aria-label="unread" />}
          </>
        );
        const cls = "notif-row" + (n.read_at ? "" : " unread");
        return n.link ? (
          <Link key={n.id} href={n.link} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={n.id} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
