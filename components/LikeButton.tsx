"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  targetId,
  targetName,
}: {
  targetId: string;
  targetName: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "liked" | "matched">("idle");
  const [busy, setBusy] = useState(false);

  async function like() {
    if (busy || state !== "idle") return;
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    // record my like (ignore duplicate-key errors)
    await supabase.from("likes").insert({ liker_id: me, liked_id: targetId });
    // did they already like me back? -> it's a match
    const { data: back } = await supabase
      .from("likes")
      .select("liker_id")
      .eq("liker_id", targetId)
      .eq("liked_id", me)
      .maybeSingle();
    setState(back ? "matched" : "liked");
    setBusy(false);
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
