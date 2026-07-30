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
