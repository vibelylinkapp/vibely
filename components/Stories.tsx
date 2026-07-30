"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Story = {
  id: string;
  media_url: string;
  caption: string | null;
  created_at: string;
};
type Author = { id: string; display_name: string; avatar_url: string | null };
type Group = { author: Author; stories: Story[] };

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export default function Stories({
  currentUserId,
  myName,
  myAvatar,
  groups,
}: {
  currentUserId: string;
  myName: string;
  myAvatar: string | null;
  groups: Group[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Group | null>(null);
  const [idx, setIdx] = useState(0);

  const mine = groups.find((g) => g.author.id === currentUserId) ?? null;
  const others = groups.filter((g) => g.author.id !== currentUserId);

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
      setError("Image must be under 8 MB.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${currentUserId}/stories/${Date.now()}.${ext}`;
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
      .from("stories")
      .insert({ profile_id: currentUserId, media_url: pub.publicUrl });
    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    router.refresh();
  }

  function openGroup(g: Group) {
    setIdx(0);
    setViewing(g);
  }

  function next() {
    if (!viewing) return;
    if (idx < viewing.stories.length - 1) setIdx(idx + 1);
    else setViewing(null);
  }
  function prev() {
    if (idx > 0) setIdx(idx - 1);
  }

  return (
    <div className="story-bar">
      <button
        type="button"
        className="story-item"
        onClick={() => (mine ? openGroup(mine) : inputRef.current?.click())}
        disabled={busy}
      >
        <span className={"story-ring" + (mine ? " active" : " add")}>
          <span className="story-avatar">
            {myAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={myAvatar} alt="You" />
            ) : (
              myName.charAt(0).toUpperCase()
            )}
          </span>
          {!mine && <span className="story-plus">+</span>}
        </span>
        <span className="story-name">{busy ? "Posting..." : "Your story"}</span>
      </button>

      {mine && (
        <button
          type="button"
          className="story-item"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <span className="story-ring add">
            <span className="story-avatar story-avatar-plain">
              <span className="story-plus-lg">+</span>
            </span>
          </span>
          <span className="story-name">Add</span>
        </button>
      )}

      {others.map((g) => (
        <button
          key={g.author.id}
          type="button"
          className="story-item"
          onClick={() => openGroup(g)}
        >
          <span className="story-ring active">
            <span className="story-avatar">
              {g.author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.author.avatar_url} alt={g.author.display_name} />
              ) : (
                g.author.display_name.charAt(0).toUpperCase()
              )}
            </span>
          </span>
          <span className="story-name">
            {g.author.display_name.split(" ")[0]}
          </span>
        </button>
      ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        hidden
      />
      {error && <p className="auth-msg story-err">{error}</p>}

      {viewing && (
        <div className="story-viewer" onClick={() => setViewing(null)}>
          <div className="story-progress">
            {viewing.stories.map((s, i) => (
              <span
                key={s.id}
                className={"story-progress-bar" + (i <= idx ? " on" : "")}
              />
            ))}
          </div>
          <div className="story-viewer-head">
            <span className="story-viewer-name">
              {viewing.author.display_name}
            </span>
            <button
              type="button"
              className="story-close"
              onClick={(e) => {
                e.stopPropagation();
                setViewing(null);
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="story-media"
            src={viewing.stories[idx].media_url}
            alt=""
          />
          {viewing.stories[idx].caption && (
            <p className="story-caption">{viewing.stories[idx].caption}</p>
          )}
          <button
            type="button"
            className="story-nav story-nav-left"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
          />
          <button
            type="button"
            className="story-nav story-nav-right"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
          />
        </div>
      )}
    </div>
  );
}
