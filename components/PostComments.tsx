"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Commenter = { id: string; display_name: string; avatar_url: string | null };
type Comment = { id: string; author: Commenter; body: string; created_at: string };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PostComments({
  postId,
  me,
  initial,
}: {
  postId: string;
  me: Commenter;
  initial: Comment[];
}) {
  const [list, setList] = useState<Comment[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const body = text.trim();
    if (busy || !body) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: me.id, body })
      .select("id, created_at")
      .single();
    if (error || !data) {
      setBusy(false);
      return;
    }
    setList((l) => [
      ...l,
      { id: data.id, author: me, body, created_at: data.created_at },
    ]);
    setText("");
    setBusy(false);
  }

  async function remove(commentId: string) {
    const supabase = createClient();
    const prev = list;
    setList((l) => l.filter((c) => c.id !== commentId));
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);
    if (error) setList(prev);
  }

  const label =
    list.length === 0
      ? "No comments yet"
      : list.length === 1
      ? "1 comment"
      : `${list.length} comments`;

  return (
    <div className="comments">
      <h3 className="comments-h">{label}</h3>
      <div className="comment-list">
        {list.map((c) => (
          <div className="comment" key={c.id}>
            <Link href={`/u/${c.author.id}`} className="comment-av">
              {c.author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.author.avatar_url} alt={c.author.display_name} />
              ) : (
                c.author.display_name.charAt(0).toUpperCase()
              )}
            </Link>
            <div className="comment-body">
              <div className="comment-top">
                <Link href={`/u/${c.author.id}`} className="comment-name">
                  {c.author.display_name}
                </Link>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
              <p className="comment-text">{c.body}</p>
            </div>
            {c.author.id === me.id && (
              <button
                type="button"
                className="comment-del"
                onClick={() => remove(c.id)}
                aria-label="Delete comment"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="comment-composer">
        <input
          className="comment-input"
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          maxLength={500}
          disabled={busy}
        />
        <button
          type="button"
          className="comment-send"
          onClick={submit}
          disabled={busy || !text.trim()}
        >
          {busy ? "..." : "Post"}
        </button>
      </div>
    </div>
  );
}
