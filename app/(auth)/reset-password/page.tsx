"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { passwordProblem } from "@/lib/security/password";

/**
 * Step 2 of password recovery. Reached from the emailed link via
 * /auth/callback, which has already created a short-lived recovery session.
 * Without that session the page explains the link has expired.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "expired">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          setEmail(data.user.email ?? "");
          setState("ready");
        } else {
          setState("expired");
        }
      });
  }, []);

  const issue = password ? passwordProblem(password, email) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const weak = passwordProblem(password, email);
    if (weak) return setMsg(weak);
    if (password !== confirm) return setMsg("The two passwords do not match.");
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setSaving(false);
      setMsg(
        /same|different/i.test(error.message)
          ? "Choose a password you have not used before."
          : "We could not update your password. Request a new link and try again."
      );
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="glow" />
      <section className="auth-card">
        <Link href="/" className="auth-logo">
          Vibely
        </Link>
        <h1 className="auth-title">Choose a new password</h1>
        {state === "checking" && <p className="auth-sub">Checking your link...</p>}
        {state === "expired" && (
          <>
            <p className="auth-sub">
              This reset link has expired or was opened on a different device.
              Request a new one and open it on this device.
            </p>
            <p className="auth-toggle">
              <Link href="/forgot-password">Send a new link</Link>
            </p>
          </>
        )}
        {state === "ready" && (
          <form onSubmit={submit} className="auth-form">
            <input
              type="password"
              required
              placeholder="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Repeat new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <p className={"pw-hint" + (issue ? " is-warn" : "")} aria-live="polite">
              {issue ?? "At least 10 characters, with letters and a number or symbol."}
            </p>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save new password"}
            </button>
          </form>
        )}
        {msg && <p className="auth-msg">{msg}</p>}
      </section>
    </main>
  );
}
