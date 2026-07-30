"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPlanButton({
  planId,
  isHost,
  joined,
  full,
}: {
  planId: string;
  isHost: boolean;
  joined: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState(joined);
  const [busy, setBusy] = useState(false);

  if (isHost) return <span className="plan-badge">You&apos;re hosting</span>;

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    if (state) {
      await supabase
        .from("plan_participants")
        .delete()
        .eq("plan_id", planId)
        .eq("profile_id", me);
      setState(false);
    } else {
      await supabase
        .from("plan_participants")
        .insert({ plan_id: planId, profile_id: me });
      setState(true);
    }
    setBusy(false);
    router.refresh();
  }

  if (!state && full) return <span className="plan-badge muted">Full</span>;

  return (
    <button
      type="button"
      className={"plan-join" + (state ? " joined" : "")}
      onClick={toggle}
      disabled={busy}
    >
      {busy ? "..." : state ? "Leave" : "Join"}
    </button>
  );
}
