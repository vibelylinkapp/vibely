"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Cover photo picker. Uploads straight to the existing public "post-media"
// bucket under <uid>/covers/<file>, which is what its insert policy requires
// (first path segment must equal auth.uid()). Reusing that bucket means no
// new migration and no new storage policies to run before this works.
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function CoverUpload({
  value,
  onChange,
  label = "Cover photo",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 10 MB.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setError("Sign in again to upload a photo.");
      setBusy(false);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${me}/covers/${Date.now()}.${ext}`;
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
    onChange(pub.publicUrl);
    setBusy(false);
  }

  return (
    <div className="fld">
      <span className="fld-l">
        {label} <em>optional</em>
      </span>

      {value ? (
        <div className="cvr-prev">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <div className="cvr-prev-a">
            <button
              type="button"
              className="cvr-mini"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              className="cvr-mini"
              onClick={() => onChange("")}
              disabled={busy}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cvr-drop"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 16l-5-5-7 7" />
          </svg>
          <b>{busy ? "Uploading..." : "Add a cover photo"}</b>
          <span>JPG, PNG or WebP, up to 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={onPick}
      />
      {error && <span className="fld-err">{error}</span>}
    </div>
  );
}
