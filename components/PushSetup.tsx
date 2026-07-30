"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "busy";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushSetup() {
  const [state, setState] = useState<State>("loading");
  const supabase = createClient();

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, [supported]);

  async function enable() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setState("off");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("off");
        return;
      }
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          profile_id: user.id,
          endpoint: sub.endpoint,
          subscription: json as unknown as Json,
        },
        { onConflict: "endpoint" }
      );
      if (error) {
        setState("off");
        return;
      }
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="push-setup">
      <div className="push-copy">
        <strong>Push notifications</strong>
        <span>Get alerted about new matches and messages.</span>
      </div>
      {state === "denied" ? (
        <span className="push-hint">Blocked in browser settings</span>
      ) : state === "on" ? (
        <button className="push-btn off" onClick={disable}>
          Turn off
        </button>
      ) : (
        <button
          className="push-btn"
          onClick={enable}
          disabled={state === "busy"}
        >
          {state === "busy" ? "…" : "Enable"}
        </button>
      )}
    </div>
  );
}
