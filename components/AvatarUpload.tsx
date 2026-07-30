"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function AvatarUpload({
  userId,
  avatarUrl,
  displayName,
}: {
  userId: string;
  avatarUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
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
    <div className="avatar-upload">
      <button
        type="button"
        className="profile-avatar avatar-btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change photo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={displayName} />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
        <span className="avatar-edit">{busy ? "Uploading" : "Edit"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        hidden
      />
      {error && <p className="auth-msg">{error}</p>}
    </div>
  );
}
