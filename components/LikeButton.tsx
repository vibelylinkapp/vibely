"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  targetId,
  targetName,
}: {
  targetId: string;
  targetName: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "liked" | "matched" | "limit">(
    "idle"
  );
  const [busy, setBusy] = useState(false);

  async function like() {
    if (busy || state !== "idle") return;
    setBusy(true);
    try {
      // Like creation runs server-side so the free daily quota can't be
      // bypassed from the client.
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        matched?: boolean;
        reason?: string;
      };
      if (res.status === 429 && json.reason === "daily_limit") {
        setState("limit");
        setBusy(false);
        return;
      }
      if (!res.ok || !json.ok) {
        setBusy(false);
        return;
      }
      setState(json.matched ? "matched" : "liked");
      if (json.matched) {
        // Notify the other person that they matched (best-effort).
        fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ toUserId: targetId, kind: "match" }),
        }).catch(() => {});
      }
      setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  async function messageMatch() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_conversation", {
      other_id: targetId,
    });
    if (error || !data) {
      setBusy(false);
      alert(error?.message ?? "Could not open the chat.");
      return;
    }
    router.push(`/messages/${data}`);
  }

  if (state === "limit") {
    return (
      <div className="like-limit">
        <span className="sub">
          You&apos;ve used your 15 free likes for today.
        </span>
        <Link href="/upgrade" className="pcard-like liked">
          Upgrade for unlimited likes
        </Link>
      </div>
    );
  }

  if (state === "matched") {
    return (
      <div className="like-matched">
        <span className="match-tag">It&apos;s a match!</span>
        <button
          type="button"
          className="pcard-msg"
          onClick={messageMatch}
          disabled={busy}
        >
          {busy ? "Opening..." : `Message ${targetName.split(" ")[0]}`}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={"pcard-like" + (state === "liked" ? " liked" : "")}
      onClick={like}
      disabled={busy || state === "liked"}
    >
      {state === "liked" ? "Liked" : busy ? "..." : "Like"}
    </button>
  );
}
