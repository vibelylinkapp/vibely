"use client";

import { useEffect, useRef, useState } from "react";

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Compact chat voice-note player: play/pause + progress + time.
export default function VoiceNote({
  src,
  mine,
}: {
  src: string | null;
  mine: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // Ignore the huge currentTime used by the duration workaround below.
    const onTime = () => {
      if (a.currentTime < 1e6) setCur(a.currentTime);
    };
    const onMeta = () => {
      if (a.duration === Infinity || isNaN(a.duration)) {
        // Chrome reports Infinity for MediaRecorder webm until it's seeked.
        const fix = () => {
          a.removeEventListener("timeupdate", fix);
          if (isFinite(a.duration)) setDur(a.duration);
          a.currentTime = 0;
        };
        a.addEventListener("timeupdate", fix);
        a.currentTime = 1e101;
      } else {
        setDur(a.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setCur(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(
        () => setPlaying(true),
        () => {}
      );
    }
  }

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const label = playing || cur > 0 ? fmt(cur) : fmt(dur);

  return (
    <div className={"voicenote" + (mine ? " mine" : "")}>
      <button
        type="button"
        className="vn-play"
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="vn-track">
        <span className="vn-fill" style={{ width: pct + "%" }} />
      </div>
      <span className="vn-time">{label}</span>
      {src && <audio ref={audioRef} src={src} preload="metadata" />}
    </div>
  );
}
