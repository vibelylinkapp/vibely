"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Tables } from "@/lib/database.types";

type Msg = Pick<
  Tables<"messages">,
  "id" | "sender_id" | "body" | "created_at" | "media_url" | "kind"
>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
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
  const supabase = useRef(createClient()).current;
  const endRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

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

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || uploading || sending) return;
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("That file isn't an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErr("Image is too large (max 5 MB).");
      return;
    }
    setUploading(true);
    try {
      const path = `${currentUserId}/chat/${crypto.randomUUID()}.${extFor(
        file.type
      )}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (upErr) {
        setErr("Upload failed. Please try again.");
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          kind: "image",
          media_url: pub.publicUrl,
          body: null,
        })
        .select("id, sender_id, body, created_at, media_url, kind")
        .single();
      if (error) {
        setErr("Couldn't send the photo. Please try again.");
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
          messages.map((m) => (
            <div key={m.id} className="bubble-group">
              <div
                className={
                  "bubble " +
                  (m.sender_id === currentUserId ? "mine" : "theirs") +
                  (m.media_url ? " has-media" : "")
                }
              >
                {m.media_url ? (
                  <a href={m.media_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="bubble-media" src={m.media_url} alt="Shared photo" />
                  </a>
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
          ))
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </label>
        <input
          value={text}
          onChange={onType}
          placeholder={uploading ? "Sending photo..." : "Message..."}
          maxLength={2000}
          autoComplete="off"
          disabled={uploading}
        />
        <button
          type="submit"
          className="btn"
          disabled={sending || uploading || !text.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
