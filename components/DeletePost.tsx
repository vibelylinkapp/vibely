"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePost({
  postId,
  mediaUrl,
}: {
  postId: string;
  mediaUrl: string | null;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    const supabase = createClient();
    // Best-effort media cleanup (RLS restricts deletes to the owner folder).
    if (mediaUrl) {
      const marker = "/post-media/";
      const i = mediaUrl.indexOf(marker);
      if (i >= 0) {
        const path = mediaUrl.slice(i + marker.length);
        await supabase.storage.from("post-media").remove([path]);
      }
    }
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      setBusy(false);
      setConfirm(false);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  if (confirm) {
    return (
      <span className="post-del-confirm">
        <button
          type="button"
          className="post-del-yes"
          onClick={del}
          disabled={busy}
        >
          {busy ? "..." : "Delete"}
        </button>
        <button
          type="button"
          className="post-del-no"
          onClick={() => setConfirm(false)}
          disabled={busy}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="post-del"
      onClick={() => setConfirm(true)}
      aria-label="Delete post"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      </svg>
    </button>
  );
}
