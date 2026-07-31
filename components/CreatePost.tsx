"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function CreatePost({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Image must be under 10 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (busy) return;
    if (!file && !caption.trim()) {
      setError("Add a photo or write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();

    let mediaUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-media")
        .upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (upErr) {
        setError(upErr.message);
        setBusy(false);
        return;
      }
      const { data: pub } = supabase.storage
        .from("post-media")
        .getPublicUrl(path);
      mediaUrl = pub.publicUrl;
    }

    const { error: dbErr } = await supabase.from("posts").insert({
      author_id: userId,
      media_url: mediaUrl,
      caption: caption.trim() || null,
    });
    if (dbErr) {
      setError(dbErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="composer">
      <button
        type="button"
        className="composer-drop"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected" />
        ) : (
          <span className="composer-drop-hint">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="9" cy="9" r="1.6" />
            </svg>
            Tap to add a photo
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        hidden
      />
      <textarea
        className="composer-caption"
        placeholder="Say something about it..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
        maxLength={500}
      />
      {error && <p className="auth-msg">{error}</p>}
      <button
        type="button"
        className="btn composer-post"
        onClick={submit}
        disabled={busy}
      >
        {busy ? "Posting..." : "Share post"}
      </button>
    </div>
  );
}
