"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Normalise a user-typed Kenyan number to E.164 (what Supabase/Twilio expect).
// Accepts: +254712345678, 254712345678, 0712345678, 712345678.
function normalizeKE(raw: string): string | null {
  let s = raw.replace(/[\s\-()]/g, "");
  if (s.startsWith("+")) return /^\+\d{7,15}$/.test(s) ? s : null;
  if (s.startsWith("0")) s = s.slice(1);
  if (s.startsWith("254")) s = s.slice(3);
  if (/^\d{9}$/.test(s)) return "+254" + s;
  return null;
}

const SHOW_PORTRAITS = [
  { src: "/landing/jane.jpg", n: "Jane, 22", d: "300m away", cls: "a" },
  { src: "/landing/kevin.jpg", n: "Kevin, 26", d: "1.2km away", cls: "b" },
  { src: "/landing/ashley.jpg", n: "Ashley, 23", d: "Online", cls: "c" },
];

export default function SignInPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMsg(error.message);
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createClient();

    if (mode === "up") {
      // Create the account (already confirmed) via our server route, then sign
      // in normally to establish the session. See app/api/auth/signup/route.ts.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setMsg(
          payload.error ?? "Could not create your account. Please try again."
        );
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }
      router.push("/home");
      router.refresh();
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const normalized = normalizeKE(phone);
    if (!normalized) {
      setMsg("Enter a valid phone number, e.g. 0712 345 678.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }
    setSentPhone(normalized);
    setMsg(`Code sent to ${normalized}.`);
    setLoading(false);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!sentPhone) return;
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: sentPhone,
      token: code.trim(),
      type: "sms",
    });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  function switchMethod(m: "email" | "phone") {
    setMethod(m);
    setMsg(null);
  }

  const title =
    method === "phone"
      ? "Sign in with your phone"
      : mode === "in"
        ? "Welcome back"
        : "Create your account";
  const sub =
    method === "phone"
      ? "We'll text you a one-time code."
      : mode === "in"
        ? "Sign in to keep meeting your people."
        : "It takes less than a minute.";

  return (
    <main className="auth2">
      <aside className="auth2-show">
        <div className="auth2-show-inner">
          <Link href="/" className="auth2-brand">
            <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF7A59" />
                  <stop offset="0.45" stopColor="#F5307E" />
                  <stop offset="1" stopColor="#7A2FF2" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="120" fill="url(#ag)" />
              <path
                d="M256 96 C181 96 120 157 120 232 C120 316 200 360 256 424 C312 360 392 316 392 232 C392 157 331 96 256 96 Z"
                fill="#fff"
              />
              <path
                d="M168 216 L210 216 L232 172 L262 268 L292 184 L314 216 L356 216"
                fill="none"
                stroke="#7A2FF2"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Vibely</span>
          </Link>

          <h2 className="auth2-show-h">
            Meet real people <span className="grad">near you.</span>
          </h2>
          <p className="auth2-show-p">
            Join thousands vibing across Kenya and East Africa — friends, dates,
            events and hangouts, all in one app.
          </p>

          <div className="auth2-cluster">
            {SHOW_PORTRAITS.map((p) => (
              <div className={"auth2-pc auth2-pc-" + p.cls} key={p.n}>
                <img src={p.src} alt={p.n} />
                <span className="auth2-pc-dot" />
                <span className="auth2-pc-cap">
                  <b>{p.n}</b>
                  <small>{p.d}</small>
                </span>
              </div>
            ))}
          </div>

          <div className="auth2-badges">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l7 3v5c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Verified people
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              </svg>
              Safe &amp; secure
            </span>
            <span>
              <span className="auth2-live" />
              2,834+ online now
            </span>
          </div>
        </div>
      </aside>

      <section className="auth2-panel">
        <div className="glow" />
        <section className="auth-card">
          <Link href="/" className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 512 512" aria-hidden="true">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF7A59" />
                  <stop offset="0.45" stopColor="#F5307E" />
                  <stop offset="1" stopColor="#7A2FF2" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="112" fill="url(#g)" />
              <path
                d="M256 96 C181 96 120 157 120 232 C120 316 200 360 256 424 C312 360 392 316 392 232 C392 157 331 96 256 96 Z"
                fill="#fff"
              />
              <path
                d="M168 216 L210 216 L232 172 L262 268 L292 184 L314 216 L356 216"
                fill="none"
                stroke="#7A2FF2"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="wordmark" style={{ fontSize: 26 }}>
              Vibely
            </span>
          </Link>

          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{sub}</p>

          <button
            type="button"
            className="btn-google"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="or-divider">
            <span>or</span>
          </div>

          <div className="method-tabs">
            <button
              type="button"
              className={"method-tab" + (method === "email" ? " on" : "")}
              onClick={() => switchMethod("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={"method-tab" + (method === "phone" ? " on" : "")}
              onClick={() => switchMethod("phone")}
            >
              Phone
            </button>
          </div>

          {method === "email" ? (
            <>
              <form onSubmit={handleEmail} className="auth-form">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="pw-field">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Password (min 6 characters)"
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    aria-pressed={showPw}
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
                        <path d="M9.9 5.1A9.4 9.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.3M6.2 6.2A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.4 9.4 0 0 0 3-.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="pw-hint">
                  {mode === "up"
                    ? "Use at least 6 characters. Tap the eye to check what you typed."
                    : "Tap the eye to reveal your password."}
                </p>
                <button className="btn" type="submit" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : mode === "in"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="auth-toggle">
                {mode === "in" ? "New to Vibely?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setMsg(null);
                  }}
                >
                  {mode === "in" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          ) : !sentPhone ? (
            <form onSubmit={sendCode} className="auth-form">
              <input
                type="tel"
                required
                placeholder="Phone (e.g. 0712 345 678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="auth-form">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify & continue"}
              </button>
              <p className="auth-toggle">
                <button
                  type="button"
                  onClick={() => {
                    setSentPhone(null);
                    setCode("");
                    setMsg(null);
                  }}
                >
                  Use a different number
                </button>
              </p>
            </form>
          )}

          {msg && <p className="auth-msg">{msg}</p>}
        </section>
      </section>
    </main>
  );
}
