"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PrivacyToggles({
  userId,
  showLocation,
  showVerification,
}: {
  userId: string;
  showLocation: boolean;
  showVerification: boolean;
}) {
  const [loc, setLoc] = useState(showLocation);
  const [ver, setVer] = useState(showVerification);
  const [busy, setBusy] = useState<null | "loc" | "ver">(null);

  async function persist(
    col: "show_location" | "show_verification",
    value: boolean
  ): Promise<boolean> {
    const supabase = createClient();
    const patch =
      col === "show_location"
        ? { show_location: value }
        : { show_verification: value };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId);
    return error === null;
  }

  async function toggleLoc() {
    if (busy) return;
    const next = !loc;
    setLoc(next);
    setBusy("loc");
    const ok = await persist("show_location", next);
    if (ok === false) setLoc(next === false);
    setBusy(null);
  }

  async function toggleVer() {
    if (busy) return;
    const next = !ver;
    setVer(next);
    setBusy("ver");
    const ok = await persist("show_verification", next);
    if (ok === false) setVer(next === false);
    setBusy(null);
  }

  return (
    <section className="privacy">
      <h3 className="privacy-h">Privacy</h3>
      <div className="privacy-row">
        <div className="privacy-copy">
          <span className="privacy-t">Show my location</span>
          <span className="privacy-s">
            Appear in People Nearby and on the map. Turning this off keeps you
            out of all location-based discovery.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={loc}
          aria-label="Show my location"
          className={"switch" + (loc ? " on" : "")}
          onClick={toggleLoc}
          disabled={busy === "loc"}
        >
          <span className="switch-knob" />
        </button>
      </div>
      <div className="privacy-row">
        <div className="privacy-copy">
          <span className="privacy-t">Show my verified badge</span>
          <span className="privacy-s">
            Display your verification checkmark to others. Off hides it from
            your cards across the app.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={ver}
          aria-label="Show my verified badge"
          className={"switch" + (ver ? " on" : "")}
          onClick={toggleVer}
          disabled={busy === "ver"}
        >
          <span className="switch-knob" />
        </button>
      </div>
    </section>
  );
}
