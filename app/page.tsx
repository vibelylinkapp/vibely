"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <main className="wrap">
      <div className="glow" />
      <section className="hero">
        <div className="logo">
          <svg width="60" height="60" viewBox="0 0 512 512" role="img" aria-label="Vibely">
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
          <span className="wordmark">Vibely</span>
        </div>

        <h1 className="headline">
          Meet real people <span className="grad">near you.</span>
        </h1>
        <p className="sub">
          Dating, friends, hangouts, and networking — one app to find your
          people across Kenya and East Africa.
        </p>

        {joined ? (
          <p className="ok">You are on the list. We will be in touch soon.</p>
        ) : (
          <form
            className="waitlist"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setJoined(true);
            }}
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" type="submit">
              Join the waitlist
            </button>
          </form>
        )}

        <div className="tags">
          <span className="tag">Nairobi first</span>
          <span className="tag">Verified people</span>
          <span className="tag">In-app chat</span>
          <span className="tag">Made in Kenya</span>
        </div>

        <p className="soon">Launching in Nairobi soon</p>
      </section>
    </main>
  );
}
