"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Msg = Pick<Tables<"messages">, "id" | "sender_id" | "body" | "created_at">;

export default function Chat({
  conversationId,
  currentUserId,
  otherUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUserId: string | null;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = useRef(createClient()).current;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

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

  return (
    <div className="chat">
      <div className="chat-scroll">
        {messages.length === 0 ? (
          <p className="chat-empty">Say hello and start the conversation.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                "bubble " + (m.sender_id === currentUserId ? "mine" : "theirs")
              }
            >
              {m.body}
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
