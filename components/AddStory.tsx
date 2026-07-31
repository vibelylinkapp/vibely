"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export default function AddStory({
  userId,
  triggerClass,
  triggerContent,
}: {
  userId: string;
  triggerClass?: string;
  triggerContent?: React.ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setCaption("");
    setError(null);
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
      setError("Image must be under 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (busy) return;
    if (!file) {
      setError("Pick a photo for your story.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/stories/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("stories").insert({
      profile_id: userId,
      media_url: pub.publicUrl,
      caption: caption.trim() || null,
    });
    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    reset();
    setOpen(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass ?? "btn"}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? "Add to story"}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add to your story</h3>
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
                alt="Story preview"
              />
            ) : (
              <button
                type="button"
                className="modal-drop"
                onClick={() => inputRef.current?.click()}
              >
                Tap to choose a photo
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
            <textarea
              className="modal-input"
              rows={2}
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Posting..." : "Share story"}
              </button>
            </div>
            {error && <p className="auth-msg">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
