"use client";

import "@/app/highlights-plus.css";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Highlight } from "@/lib/highlights";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_HIGHLIGHTS = 10;
const TITLE_MAX = 24;

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

export default function HighlightsEditor({
  userId,
  initialHighlights,
}: {
  userId: string;
  initialHighlights: Highlight[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Highlight[]>(initialHighlights);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reorder mode: a no-scroll wrapped grid you drag to rearrange.
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Media lives under the user's own folder in the shared avatars bucket,
  // e.g. avatars/<uid>/highlights/... — same convention as photos and stories.
  function pathFromUrl(url: string): string | null {
    const marker = "/avatars/";
    const i = url.indexOf(marker);
    return i === -1 ? null : url.slice(i + marker.length);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setTitle("");
    setCaption("");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    if (!ACCEPTED.includes(f.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (busy) return;
    const cleanTitle = title.trim();
    if (!file) {
      setError("Pick a cover photo for your highlight.");
      return;
    }
    if (!cleanTitle) {
      setError("Give your highlight a short title.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/highlights/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { data: row, error: dbErr } = await supabase
      .from("highlights")
      .insert({
        profile_id: userId,
        title: cleanTitle,
        media_url: pub.publicUrl,
        caption: caption.trim() || null,
        position: items.length,
      })
      .select("id, title, media_url, caption")
      .single();
    if (dbErr || !row) {
      setError(dbErr?.message ?? "Could not save the highlight.");
      setBusy(false);
      return;
    }
    setItems((prev) => [...prev, row]);
    setBusy(false);
    close();
  }

  async function remove(item: Highlight) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("highlights")
      .delete()
      .eq("id", item.id);
    if (delErr) {
      setError(delErr.message);
      setBusy(false);
      return;
    }
    const p = pathFromUrl(item.media_url);
    if (p) await supabase.storage.from("avatars").remove([p]);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setBusy(false);
  }

  function setItemRef(id: string, el: HTMLDivElement | null) {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }

  function toggleReorder() {
    setError(null);
    setDragIndex(null);
    setReordering((v) => !v);
  }

  function onItemPointerDown(index: number, e: React.PointerEvent<HTMLDivElement>) {
    if (!reordering) return;
    e.preventDefault();
    setDragIndex(index);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is optional; reordering still works without it.
    }
  }

  function onItemPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragIndex === null) return;
    const x = e.clientX;
    const y = e.clientY;
    let best = dragIndex;
    let bestDist = Infinity;
    items.forEach((it, i) => {
      const el = itemRefs.current.get(it.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== dragIndex) {
      setItems((prev) => moveItem(prev, dragIndex, best));
      setDragIndex(best);
    }
  }

  async function persistOrder(ordered: Highlight[]) {
    const supabase = createClient();
    const results = await Promise.all(
      ordered.map((it, i) =>
        supabase.from("highlights").update({ position: i }).eq("id", it.id)
      )
    );
    if (results.some((r) => r.error)) {
      setError("Could not save the new order — please try again.");
    }
  }

  function onItemPointerUp() {
    if (dragIndex === null) return;
    setDragIndex(null);
    void persistOrder(items);
  }

  return (
    <div className="hl-edit">
      <div className="hl-edit-head">
        <strong>Highlights</strong>
        <span className="hl-head-right">
          <span className="sub">
            {items.length}/{MAX_HIGHLIGHTS}
          </span>
          {items.length >= 2 && (
            <button
              type="button"
              className="hl-reorder-btn"
              onClick={toggleReorder}
              disabled={busy}
            >
              {reordering ? "Done" : "Reorder"}
            </button>
          )}
        </span>
      </div>

      {reordering ? (
        <>
          <p className="hl-reorder-tip">Drag to rearrange, then tap Done.</p>
          <div className="hl-reorder">
            {items.map((it, i) => (
              <div
                key={it.id}
                ref={(el) => setItemRef(it.id, el)}
                className={"hl-ritem" + (dragIndex === i ? " lifted" : "")}
                onPointerDown={(e) => onItemPointerDown(i, e)}
                onPointerMove={onItemPointerMove}
                onPointerUp={onItemPointerUp}
                onPointerCancel={onItemPointerUp}
              >
                <div className="hl-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.media_url} alt={it.title} draggable={false} />
                </div>
                <span className="hl-title">{it.title}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="hl-row">
          {items.map((it) => (
            <div className="hl-item" key={it.id}>
              <div className="hl-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.media_url} alt={it.title} />
                <button
                  type="button"
                  className="hl-del"
                  onClick={() => remove(it)}
                  disabled={busy}
                  aria-label={`Remove ${it.title}`}
                >
                  ×
                </button>
              </div>
              <span className="hl-title">{it.title}</span>
            </div>
          ))}
          {items.length < MAX_HIGHLIGHTS && (
            <div className="hl-item">
              <button
                type="button"
                className="hl-add"
                onClick={() => setOpen(true)}
                disabled={busy}
                aria-label="Add a highlight"
              >
                +
              </button>
              <span className="hl-title">New</span>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New highlight</h3>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPick}
              hidden
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="story-preview"
                src={preview}
                alt="Highlight preview"
              />
            ) : (
              <button
                type="button"
                className="modal-drop"
                onClick={() => inputRef.current?.click()}
              >
                Tap to choose a cover photo
              </button>
            )}
            {preview && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => inputRef.current?.click()}
              >
                Choose a different photo
              </button>
            )}
            <input
              className="modal-input"
              type="text"
              maxLength={TITLE_MAX}
              placeholder="Title (e.g. Travel, Gym, 2024)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="modal-input"
              rows={2}
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Saving..." : "Add highlight"}
              </button>
            </div>
            {error && <p className="auth-msg">{error}</p>}
          </div>
        </div>
      )}
      {!open && error && <p className="auth-msg">{error}</p>}
    </div>
  );
}
