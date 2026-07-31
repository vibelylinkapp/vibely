"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Msg = Pick<Tables<"messages">, "id" | "sender_id" | "body" | "created_at">;

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
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = useRef(createClient()).current;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      .channel(`messages:${conversationId}`)
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
          // A message arrived from the other member while I'm viewing the
          // thread — mark it read so their receipt flips to "Seen" live.
          if (m.sender_id !== currentUserId) markRead();
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
          // The other member just read the thread — advance their read marker.
          if (row.profile_id === otherUserId && row.last_read_at) {
            setOtherRead((prev) =>
              !prev || new Date(row.last_read_at!) > new Date(prev)
                ? row.last_read_at
                : prev
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, otherUserId, supabase]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
      })
      .select("id, sender_id, body, created_at")
      .single();
    if (error) {
      setText(body);
    } else if (data) {
      setMessages((prev) =>
        prev.some((x) => x.id === data.id) ? prev : [...prev, data]
      );
      // Fire a push to the recipient (best-effort; server match-gates it).
      if (otherUserId) {
        fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ toUserId: otherUserId, kind: "message" }),
        }).catch(() => {});
      }
    }
    setSending(false);
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
                  (m.sender_id === currentUserId ? "mine" : "theirs")
                }
              >
                {m.body}
              </div>
              {lastMine && m.id === lastMine.id && (
                <div className={"receipt" + (seen ? " seen" : "")}>
                  {seen ? "Seen" : "Sent"}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          maxLength={2000}
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn"
          disabled={sending || !text.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
