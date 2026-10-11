"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isEmail } from "@/lib/security/sanitize";

/**
 * Step 1 of password recovery. Always shows the same confirmation, whether
 * or not the email has an account, so this page cannot be used to find out
 * who is registered. The link in the email lands on /auth/callback, which
 * exchanges the code and forwards to /reset-password.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const clean = email.trim().toLowerCase();
    if (!isEmail(clean)) {
      setMsg("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error && /rate|too many/i.test(error.message)) {
      setMsg("Too many attempts. Please wait a few minutes and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="wrap">
      <div className="glow" />
      <section className="auth-card">
        <Link href="/" className="auth-logo">
          Vibely
        </Link>
        <h1 className="auth-title">Reset your password</h1>
        {sent ? (
          <>
            <p className="auth-sub">
              If an account uses that email, a reset link is on its way. Open it
              on this device. It expires in one hour. Check your spam folder if
              it has not arrived in a few minutes.
            </p>
            <p className="auth-toggle">
              <Link href="/sign-in">Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-sub">
              Enter the email you signed up with and we will send you a link to
              choose a new password. Signed up with your phone? Just sign in
              with a new code instead.
            </p>
            <form onSubmit={submit} className="auth-form">
              <input
                type="email"
                required
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="auth-toggle">
              Remembered it? <Link href="/sign-in">Sign in</Link>
            </p>
          </>
        )}
        {msg && <p className="auth-msg">{msg}</p>}
      </section>
    </main>
  );
}
