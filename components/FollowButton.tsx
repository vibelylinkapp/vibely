"use client";

import "@/app/profile-plus.css";
import { useState } from "react";

// Optimistic follow / unfollow toggle. Mirrors the /api/like client contract:
// the write runs server-side so RLS + block rules are enforced. Reverts on error.
export default function FollowButton({
  targetId,
  targetName,
  initialFollowing,
}: {
  targetId: string;
  targetName: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(!!initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !following;
    setBusy(true);
    setFollowing(next);
    try {
      const res = await fetch(next ? "/api/follow" : "/api/unfollow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={"follow-btn" + (following ? " on" : "")}
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${targetName}` : `Follow ${targetName}`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
