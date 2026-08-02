"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// Header avatar with in-place editing. Keeps the ring / verified shield /
// online dot visuals of the original static avatar, but the "Edit" pill now
// opens the file picker and updates profiles.avatar_url on the same page.
export default function ProfileAvatar({
  userId,
  avatarUrl,
  displayName,
  showVerified,
  isOnline,
}: {
  userId: string;
  avatarUrl: string | null;
  displayName: string;
  showVerified: boolean;
  isOnline: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = displayName.charAt(0).toUpperCase();

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
    const path = `${userId}/${Date.now()}.${ext}`;

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
      .update({ avatar_url: pub.publicUrl })
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
    <div className="pf3-avatar-wrap">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pf3-avatar" src={preview} alt={displayName} />
      ) : (
        <span className="pf3-avatar pf3-avatar-fallback">{initial}</span>
      )}
      {showVerified && (
        <span className="pf3-shield" aria-label="Verified">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 12.5l3 3 7-7"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      {isOnline && <span className="pf3-online-dot" aria-label="Online now" />}
      <button
        type="button"
        className="pf4-av-edit"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
      >
        {busy ? "Uploading" : "Edit"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        hidden
      />
      {error && <p className="auth-msg pf4-av-err">{error}</p>}
    </div>
  );
}
