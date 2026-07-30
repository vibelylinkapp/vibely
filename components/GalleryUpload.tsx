"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 6;

type Photo = { id: string; url: string };

export default function GalleryUpload({
  userId,
  initialPhotos,
}: {
  userId: string;
  initialPhotos: Photo[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storage path lives under the user's own folder, e.g. avatars/<uid>/gallery/...
  function pathFromUrl(url: string): string | null {
    const marker = "/avatars/";
    const i = url.indexOf(marker);
    return i === -1 ? null : url.slice(i + marker.length);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
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
    const path = `${userId}/gallery/${Date.now()}.${ext}`;

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
      .from("photos")
      .insert({
        profile_id: userId,
        url: pub.publicUrl,
        position: photos.length,
      })
      .select("id, url")
      .single();
    if (dbErr || !row) {
      setError(dbErr?.message ?? "Could not save the photo.");
      setBusy(false);
      return;
    }

    setPhotos((prev) => [...prev, { id: row.id, url: row.url }]);
    setBusy(false);
  }

  async function remove(photo: Photo) {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);
    if (delErr) {
      setError(delErr.message);
      setBusy(false);
      return;
    }
    const path = pathFromUrl(photo.url);
    if (path) await supabase.storage.from("avatars").remove([path]);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setBusy(false);
  }

  return (
    <div className="gallery-edit">
      <div className="gallery-edit-head">
        <strong>Photo gallery</strong>
        <span className="sub">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>
      <div className="gallery-grid">
        {photos.map((p) => (
          <div className="gallery-cell" key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="Gallery photo" />
            <button
              type="button"
              className="gallery-del"
              onClick={() => remove(p)}
              disabled={busy}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            className="gallery-add"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "…" : "+"}
          </button>
        )}
      </div>
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
