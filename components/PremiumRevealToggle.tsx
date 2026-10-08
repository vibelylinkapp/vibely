"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Opt-in for the paid instant WhatsApp reveal.
 *
 * Off by default. When on, Gold and VIP members can see this member's
 * number without asking first. The check itself lives in the
 * reveal_whatsapp_premium RPC (migration 0046).
 *
 * The state is loaded here rather than on the profile page so that, if
 * migration 0046 has not been run yet, only this toggle hides itself and
 * the rest of the WhatsApp settings keep working.
 */
export default function PremiumRevealToggle() {
  const [uid, setUid] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || user === null) return;
      const { data, error: e } = await supabase
        .from("member_contacts")
        .select("allow_premium_reveal")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (cancelled || e) return;
      setUid(user.id);
      setOn(Boolean(data?.allow_premium_reveal));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (ready === false || uid === null) return null;

  async function toggle() {
    if (busy || uid === null) return;
    const next = on === false;
    setOn(next);
    setBusy(true);
    setError(null);
    const { error: e } = await createClient()
      .from("member_contacts")
      .update({ allow_premium_reveal: next })
      .eq("profile_id", uid);
    if (e) {
      setOn(next === false);
      setError("Could not save that. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="privacy-row" style={{ marginTop: 12 }}>
      <div className="privacy-copy">
        <span className="privacy-t">Let Gold and VIP members see my number</span>
        <span className="privacy-s">
          Upgraded members can reveal your WhatsApp number without asking
          first. Leave this off to approve every request yourself.
        </span>
        {error && <span className="auth-msg">{error}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Let Gold and VIP members see my number"
        className={"switch" + (on ? " on" : "")}
        onClick={toggle}
        disabled={busy}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}
