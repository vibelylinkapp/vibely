"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The three-up action row on the People-near-you cards: Pass, Say hi, Like.
// Pass and Like hit the same endpoints the swipe deck / like button use, so the
// daily like quota and match detection still apply. "Say hi" opens the person's
// profile (there is no separate wave endpoint). Optimistic UI throughout.
export default function PnearActions({
  targetId,
  targetName,
  initialLiked = false,
}: {
  targetId: string;
  targetName: string;
  initialLiked?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [passed, setPassed] = useState(false);
  const [busy, setBusy] = useState(false);
  const first = targetName.split(" ")[0];
  const done = liked || passed;

  async function like(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || done) return;
    setBusy(true);
    setLiked(true);
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

  async function pass(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || done) return;
    setBusy(true);
    setPassed(true);
    try {
      const res = await fetch("/api/pass", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !json.ok) setPassed(false);
    } catch {
      setPassed(false);
    } finally {
      setBusy(false);
    }
  }

  function sayHi(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/u/${targetId}`);
  }

  return (
    <div className={"pnear-acts" + (passed ? " passed" : "")}>
      <button
        type="button"
        className="pnear-act pnear-act-x"
        onClick={pass}
        disabled={busy || done}
        aria-label={`Pass ${first}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <button
        type="button"
        className="pnear-act pnear-act-hi"
        onClick={sayHi}
        aria-label={`Say hi to ${first}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
      <button
        type="button"
        className={"pnear-act pnear-act-heart" + (liked ? " on" : "")}
        onClick={like}
        disabled={busy || done}
        aria-pressed={liked}
        aria-label={liked ? `Liked ${first}` : `Like ${first}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
        </svg>
      </button>
    </div>
  );
}
