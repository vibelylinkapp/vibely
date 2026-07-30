"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    // On success the browser is redirected to Google, then back to /auth/callback.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createClient();

    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMsg("Check your email to confirm your account, then sign in.");
        setLoading(false);
      }
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

  return (
    <main className="wrap">
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

        <h1 className="auth-title">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="auth-sub">
          {mode === "in"
            ? "Sign in to keep meeting your people."
            : "It takes less than a minute."}
        </p>

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

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {msg && <p className="auth-msg">{msg}</p>}

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
      </section>
    </main>
  );
}
