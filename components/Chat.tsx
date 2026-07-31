"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Tables } from "@/lib/database.types";
import VoiceNote from "@/components/VoiceNote";

type Msg = Pick<
  Tables<"messages">,
  "id" | "sender_id" | "body" | "created_at" | "media_url" | "kind"
>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REC_SECONDS = 120;
const CHAT_BUCKET = "chat-media";

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function isHttp(u: string): boolean {
  return /^https?:\/\//.test(u);
}

function fmtSecs(n: number): string {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickRecMime(): string {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  }
  return "";
}

export default function Chat({
  conversationId,
  currentUserId,
  otherUserId,
  otherLastReadAt,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUserId: string | null;
  otherLastReadAt: string | null;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [otherRead, setOtherRead] = useState<string | null>(otherLastReadAt);
  const [otherTyping, setOtherTyping] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  // path -> short-lived signed URL for private chat-media objects.
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const supabase = useRef(createClient()).current;
  const endRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const mediaRec = useRef<MediaRecorder | null>(null);
  const recChunks = useRef<Blob[]>([]);
  const recStream = useRef<MediaStream | null>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recCancelled = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // Stop the mic if we unmount mid-recording.
  useEffect(() => {
    return () => {
      if (recTimer.current) clearInterval(recTimer.current);
      recStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Sign any private media paths we don't yet have a URL for.
  useEffect(() => {
    const pending = Array.from(
      new Set(
        messages
          .map((m) => m.media_url)
          .filter((u): u is string => !!u && !isHttp(u) && !(u in signedUrls))
      )
    );
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage
        .from(CHAT_BUCKET)
        .createSignedUrls(pending, 3600);
      if (cancelled || !data) return;
      setSignedUrls((prev) => {
        const next = { ...prev };
        for (const row of data) {
          if (row.path && row.signedUrl) next[row.path] = row.signedUrl;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, signedUrls, supabase]);

  function mediaSrc(u: string | null): string | null {
    if (!u) return null;
    if (isHttp(u)) return u; // legacy public-bucket URLs
    return signedUrls[u] ?? null;
  }

  // Mark my membership read (so the OTHER member sees "Seen" on their message).
  function markRead() {
    supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("profile_id", currentUserId)
      .then(
        () => {},
        () => {}
      );
  }

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
          if (m.sender_id !== currentUserId) {
            setOtherTyping(false);
            markRead();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            profile_id: string;
            last_read_at: string | null;
          };
          if (row.profile_id === otherUserId && row.last_read_at) {
            setOtherRead((prev) =>
              !prev || new Date(row.last_read_at!) > new Date(prev)
                ? row.last_read_at
                : prev
            );
          }
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const from = (payload as { from?: string } | undefined)?.from;
        if (from && from === otherUserId) {
          setOtherTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setOtherTyping(false), 3500);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, otherUserId, supabase]);

  function notifyRecipient() {
    if (!otherUserId) return;
    fetch("/api/push/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toUserId: otherUserId, kind: "message", conversationId }),
    }).catch(() => {});
  }

  // Throttle typing broadcasts to at most one every ~1.5s.
  function onType(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1500 && channelRef.current) {
      lastTypingSent.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { from: currentUserId },
      });
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    lastTypingSent.current = 0;
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select("id, sender_id, body, created_at, media_url, kind")
      .single();
    if (error) {
      setText(body);
    } else if (data) {
      setMessages((prev) =>
        prev.some((x) => x.id === data.id) ? prev : [...prev, data]
      );
      notifyRecipient();
    }
    setSending(false);
  }

  async function uploadAndSend(
    blob: Blob,
    ext: string,
    kind: "image" | "voice",
    contentType: string
  ) {
    setUploading(true);
    try {
      // Private bucket, member-scoped path: <conversationId>/<uid>/<uuid>.<ext>
      const path = `${conversationId}/${currentUserId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(CHAT_BUCKET)
        .upload(path, blob, { contentType, cacheControl: "3600" });
      if (upErr) {
        setErr(
          kind === "voice"
            ? "Couldn't send the voice note."
            : "Upload failed. Please try again."
        );
        return;
      }
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          kind,
          media_url: path,
          body: null,
        })
        .select("id, sender_id, body, created_at, media_url, kind")
        .single();
      if (error) {
        setErr(
          kind === "voice"
            ? "Couldn't send the voice note."
            : "Couldn't send the photo. Please try again."
        );
      } else if (data) {
        setMessages((prev) =>
          prev.some((x) => x.id === data.id) ? prev : [...prev, data]
        );
        notifyRecipient();
      }
    } finally {
      setUploading(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || uploading || sending || recording) return;
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("That file isn't an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErr("Image is too large (max 5 MB).");
      return;
    }
    await uploadAndSend(file, extFor(file.type), "image", file.type);
  }

  // ---- Voice notes ----
  function cleanupRec() {
    if (recTimer.current) {
      clearInterval(recTimer.current);
      recTimer.current = null;
    }
    recStream.current?.getTracks().forEach((t) => t.stop());
    recStream.current = null;
    setRecording(false);
    setRecSecs(0);
  }

  async function finishRecording(mime: string) {
    const chunks = recChunks.current;
    const cancelled = recCancelled.current;
    cleanupRec();
    mediaRec.current = null;
    recChunks.current = [];
    if (cancelled || chunks.length === 0) return;
    const type = mime || "audio/webm";
    const blob = new Blob(chunks, { type });
    if (blob.size === 0) return;
    const ext = type.includes("mp4")
      ? "mp4"
      : type.includes("ogg")
      ? "ogg"
      : "webm";
    await uploadAndSend(blob, ext, "voice", type);
  }

  async function startRecording() {
    if (recording || uploading || sending) return;
    setErr(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErr("Microphone permission is needed to record a voice note.");
      return;
    }
    recStream.current = stream;
    recChunks.current = [];
    recCancelled.current = false;
    const mime = pickRecMime();
    const rec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    mediaRec.current = rec;
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recChunks.current.push(ev.data);
    };
    rec.onstop = () => {
      void finishRecording(rec.mimeType || mime);
    };
    rec.start();
    setRecording(true);
    setRecSecs(0);
    recTimer.current = setInterval(() => {
      setRecSecs((s) => {
        const next = s + 1;
        if (next >= MAX_REC_SECONDS) stopRecording();
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    const rec = mediaRec.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  function cancelRecording() {
    recCancelled.current = true;
    const rec = mediaRec.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else cleanupRec();
  }

  // Read receipt shows only under MY most recent message.
  const lastMine = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === currentUserId) return messages[i];
    }
    return null;
  }, [messages, currentUserId]);
  const seen =
    !!lastMine &&
    !!otherRead &&
    new Date(otherRead) >= new Date(lastMine.created_at);

  return (
    <div className="chat">
      <div className="chat-scroll">
        {messages.length === 0 ? (
          <p className="chat-empty">Say hello and start the conversation.</p>
        ) : (
          messages.map((m) => {
            const src = m.media_url ? mediaSrc(m.media_url) : null;
            const mine = m.sender_id === currentUserId;
            const isVoice = m.kind === "voice" && !!m.media_url;
            const isImage = !isVoice && !!m.media_url;
            return (
              <div key={m.id} className="bubble-group">
                <div
                  className={
                    "bubble " +
                    (mine ? "mine" : "theirs") +
                    (isVoice ? " has-voice" : isImage ? " has-media" : "")
                  }
                >
                  {isVoice ? (
                    <VoiceNote src={src} mine={mine} />
                  ) : isImage ? (
                    src ? (
                      <a href={src} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="bubble-media" src={src} alt="Shared photo" />
                      </a>
                    ) : (
                      <span className="bubble-media loading" aria-label="Loading photo" />
                    )
                  ) : (
                    m.body
                  )}
                </div>
                {lastMine && m.id === lastMine.id && (
                  <div className={"receipt" + (seen ? " seen" : "")}>
                    {seen ? "Seen" : "Sent"}
                  </div>
                )}
              </div>
            );
          })
        )}
        {otherTyping && (
          <div className="bubble theirs typing-bubble" aria-label="typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>
      {err && <div className="chat-err">{err}</div>}
      {recording ? (
        <div className="chat-recording">
          <button
            type="button"
            className="rec-cancel"
            onClick={cancelRecording}
            aria-label="Cancel recording"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <span className="rec-dot" />
          <span className="rec-time">{fmtSecs(recSecs)}</span>
          <span className="rec-label">Recording voice note...</span>
          <button
            type="button"
            className="rec-send"
            onClick={stopRecording}
            aria-label="Send voice note"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
      ) : (
        <form className="chat-input" onSubmit={send}>
          <label
            className={"chat-attach" + (uploading ? " busy" : "")}
            aria-label="Send a photo"
          >
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              disabled={uploading || sending}
              hidden
            />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>
          <input
            value={text}
            onChange={onType}
            placeholder={uploading ? "Sending..." : "Message..."}
            maxLength={2000}
            autoComplete="off"
            disabled={uploading}
          />
          {text.trim() ? (
            <button type="submit" className="btn" disabled={sending || uploading}>
              Send
            </button>
          ) : (
            <button
              type="button"
              className="chat-mic"
              onClick={startRecording}
              disabled={uploading || sending}
              aria-label="Record a voice note"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                <path d="M12 19v3" />
              </svg>
            </button>
          )}
        </form>
      )}
    </div>
  );
}
