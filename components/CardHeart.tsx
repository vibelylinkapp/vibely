"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Compact heart button for the People-near-you cards. Outline by default;
// fills red the moment it's tapped (optimistic), then confirms with the same
// server endpoint LikeButton uses so the daily like quota still applies.
export default function CardHeart({
  targetId,
  targetName,
  initialLiked = false,
  initialMatched = false,
}: {
  targetId: string;
  targetName: string;
  initialLiked?: boolean;
  initialMatched?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked || initialMatched);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || liked) return;
    setBusy(true);
    setLiked(true); // optimistic — turns red immediately
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        matched?: boolean;
        reason?: string;
      };
      if (res.status === 429 && json.reason === "daily_limit") {
        setLiked(false);
        router.push("/upgrade");
        return;
      }
      if (!res.ok || !json.ok) {
        setLiked(false);
        return;
      }
      if (json.matched) {
        fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ toUserId: targetId, kind: "match" }),
        }).catch(() => {});
      }
    } catch {
      setLiked(false);
    } finally {
      setBusy(false);
    }
  }

  const first = targetName.split(" ")[0];
  return (
    <button
      type="button"
      className={"pnear-heart" + (liked ? " on" : "")}
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? `Liked ${first}` : `Like ${first}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
      </svg>
    </button>
  );
}
