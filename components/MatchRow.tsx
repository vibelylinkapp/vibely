"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = { id: string; display_name: string; avatar_url: string | null };

export default function MatchRow({ matches }: { matches: Match[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (matches.length === 0) return null;

  async function open(id: string) {
    setBusyId(id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_conversation", {
      other_id: id,
    });
    if (error || !data) {
      setBusyId(null);
      alert(error?.message ?? "Could not open the chat.");
      return;
    }
    router.push(`/messages/${data}`);
  }

  return (
    <div className="match-strip">
      <div className="match-strip-title">New matches</div>
      <div className="match-scroll">
        {matches.map((m) => (
          <button
            key={m.id}
            type="button"
            className="match-chip"
            onClick={() => open(m.id)}
            disabled={busyId === m.id}
          >
            <span className="match-avatar">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url} alt={m.display_name} />
              ) : (
                m.display_name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="match-chip-name">{m.display_name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
