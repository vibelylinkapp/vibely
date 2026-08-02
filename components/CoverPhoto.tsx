"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// In-place cover editor. Renders the cover image + gradient + an edit pencil
// that opens the file picker and updates profiles.cover_url right here — no
// navigation. Mirrors AvatarUpload's storage/DB pattern (avatars bucket).
export default function CoverPhoto({
  userId,
  coverUrl,
}: {
  userId: string;
  coverUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(coverUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/cover-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ cover_url: pub.publicUrl })
      .eq("id", userId);
    if (dbErr) {
      setError(dbErr.message);
      setBusy(false);
      return;
    }

    setPreview(pub.publicUrl);
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pf3-cover-img" src={preview} alt="" />
      ) : (
        <div className="pf3-cover-fallback" />
      )}
      <div className="pf3-cover-grad" />
      <button
        type="button"
        className="pf3-round pf3-edit pf4-cover-edit"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={busy ? "Uploading cover photo" : "Change cover photo"}
      >
        {busy ? (
          <span className="pf4-cover-dots" aria-hidden="true">
            …
          </span>
        ) : (
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        hidden
      />
      {error && <p className="auth-msg pf4-cover-err">{error}</p>}
    </>
  );
}
