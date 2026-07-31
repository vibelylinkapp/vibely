"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS: { id: string; label: string }[] = [
  { id: "spam", label: "Spam or misleading" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "nudity", label: "Nudity or sexual content" },
  { id: "hate", label: "Hate speech" },
  { id: "scam", label: "Scam or fraud" },
  { id: "other", label: "Something else" },
];

export default function ReportPost({
  postId,
  authorId,
  authorName,
}: {
  postId: string;
  authorId: string;
  authorName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"root" | "reasons">("root");
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setView("root");
  }

  async function hide() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    await supabase
      .from("post_hides")
      .upsert(
        { post_id: postId, profile_id: me },
        { onConflict: "post_id,profile_id" }
      );
    setBusy(false);
    close();
    router.refresh();
  }

  async function block() {
    if (busy) return;
    const who = authorName ? authorName : "this member";
    if (
      !window.confirm(
        `Block ${who}? You won't see each other's profiles, posts or messages.`
      )
    )
      return;
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    await supabase
      .from("blocks")
      .upsert(
        { blocker_id: me, blocked_id: authorId },
        { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
      );
    // Drop this post from view immediately; the block hides the rest on refresh.
    await supabase
      .from("post_hides")
      .upsert(
        { post_id: postId, profile_id: me },
        { onConflict: "post_id,profile_id" }
      );
    setBusy(false);
    close();
    router.refresh();
  }

  async function report(reason: string) {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    await supabase.from("reports").insert({
      reporter_id: me,
      reported_id: authorId,
      post_id: postId,
      reason,
    });
    // Take the reported post out of the reporter's own feed straight away.
    await supabase
      .from("post_hides")
      .upsert(
        { post_id: postId, profile_id: me },
        { onConflict: "post_id,profile_id" }
      );
    setBusy(false);
    close();
    router.refresh();
  }

  return (
    <div className="post-more-wrap">
      <button
        type="button"
        className="post-more"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="Post options"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="post-more-scrim"
            aria-label="Close menu"
            onClick={close}
          />
          <div className="post-menu" role="menu">
            {view === "root" ? (
              <>
                <button
                  type="button"
                  className="post-menu-item"
                  onClick={hide}
                  disabled={busy}
                  role="menuitem"
                >
                  Hide this post
                </button>
                <button
                  type="button"
                  className="post-menu-item danger"
                  onClick={() => setView("reasons")}
                  disabled={busy}
                  role="menuitem"
                >
                  Report post
                </button>
                <button
                  type="button"
                  className="post-menu-item danger"
                  onClick={block}
                  disabled={busy}
                  role="menuitem"
                >
                  {authorName ? `Block ${authorName}` : "Block user"}
                </button>
              </>
            ) : (
              <>
                <div className="post-menu-head">Why are you reporting this?</div>
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="post-menu-item"
                    onClick={() => report(r.id)}
                    disabled={busy}
                    role="menuitem"
                  >
                    {r.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
