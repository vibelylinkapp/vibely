"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function compactCount(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
}

export default function PostLike({
  postId,
  authorId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  authorId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, profile_id: me });
      if (error) {
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
      } else if (authorId !== me) {
        // Best-effort: let the author know someone liked their post.
        fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "post_like", postId }),
        }).catch(() => {});
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("profile_id", me);
      if (error) {
        setLiked(true);
        setCount((c) => c + 1);
      }
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={liked ? "post-like on" : "post-like"}
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
      </svg>
      <span className="post-like-n">{compactCount(count)}</span>
    </button>
  );
}
