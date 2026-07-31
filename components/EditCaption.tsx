"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EditCaption({
  postId,
  firstName,
  initialCaption,
  canEdit,
}: {
  postId: string;
  firstName: string;
  initialCaption: string | null;
  canEdit: boolean;
}) {
  const [caption, setCaption] = useState<string | null>(initialCaption);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialCaption ?? "");
  const [busy, setBusy] = useState(false);

  function open() {
    setDraft(caption ?? "");
    setEditing(true);
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    const next = draft.trim();
    const value = next.length === 0 ? null : next;
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({ caption: value })
      .eq("id", postId);
    setBusy(false);
    if (error) return;
    setCaption(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="caption-editor">
        <textarea
          className="caption-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a caption..."
          maxLength={2200}
          rows={3}
          autoFocus
          disabled={busy}
        />
        <div className="caption-actions">
          <button
            type="button"
            className="caption-cancel"
            onClick={() => setEditing(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="caption-save"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  if (caption) {
    return (
      <p className="post-caption">
        <span className="post-caption-name">{firstName}</span>{" "}
        {caption}
        {canEdit && (
          <button
            type="button"
            className="caption-edit"
            onClick={open}
            aria-label="Edit caption"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        )}
      </p>
    );
  }

  if (canEdit) {
    return (
      <button type="button" className="caption-add" onClick={open}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add a caption
      </button>
    );
  }

  return null;
}
