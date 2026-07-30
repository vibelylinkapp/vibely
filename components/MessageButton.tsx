"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function message() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_conversation", {
      other_id: targetId,
    });
    if (error || !data) {
      setBusy(false);
      alert(error?.message ?? "Could not open the chat. Please try again.");
      return;
    }
    router.push(`/messages/${data}`);
  }

  return (
    <button
      type="button"
      className="pcard-msg"
      onClick={message}
      disabled={busy}
    >
      {busy ? "Opening..." : "Message"}
    </button>
  );
}
