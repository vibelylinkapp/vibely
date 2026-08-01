"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Assets & brand                                                     */
/* ------------------------------------------------------------------ */
const IMG = {
  jane: "/landing/jane.jpg",
  kevin: "/landing/kevin.jpg",
  ashley: "/landing/ashley.jpg",
  mike: "/landing/mike.jpg",
};
const STACK = [IMG.jane, IMG.kevin, IMG.ashley, IMG.mike, IMG.jane];

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
const S = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IcUsers = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcPin = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const IcCal = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);
const IcChat = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
  </svg>
);
const IcHeart = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M12 21s-7-5.5-7-11a4.2 4.2 0 0 1 7-3 4.2 4.2 0 0 1 7 3c0 5.5-7 11-7 11z" />
  </svg>
);
const IcStar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.1l5.9-.8z" />
  </svg>
);
const IcShield = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M12 3l7 3v5c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IcLock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IcBolt = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IcPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IcApple = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
    <path d="M16.4 12.9c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1-.02 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.02-.01-2.1-.8-2.1-3.2zM14.3 6.3c.6-.7 1-1.7.9-2.7-.9.04-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .07 1.9-.5 2.5-1.2z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
type Stat = { target: number; fmt: "comma" | "plain" | "k"; label: string; ic: React.ReactNode; live?: boolean };
const STATS: Stat[] = [
  { target: 2834, fmt: "comma", label: "Online now", ic: <IcUsers />, live: true },
  { target: 487, fmt: "plain", label: "People nearby", ic: <IcPin /> },
  { target: 93, fmt: "plain", label: "Events today", ic: <IcCal /> },
  { target: 34000, fmt: "k", label: "Chats today", ic: <IcChat /> },
];

const ACTIVITY = [
  { a: "James", t: "joined Vibely", when: "just now", ic: <IcBolt />, tone: "v" },
  { a: "Sarah", t: "created Coffee Meetup", when: "2 min ago", ic: <IcCal />, tone: "m" },
  { a: "Amina", t: "matched with Brian", when: "3 min ago", ic: <IcHeart />, tone: "c" },
  { a: "Kevin", t: "checked in at Sarit", when: "5 min ago", ic: <IcPin />, tone: "b" },
  { a: "Wanjiru", t: "is online near you", when: "just now", ic: <IcUsers />, tone: "v" },
];

const CITIES = [
  { c: "Nairobi", n: 254, top: "62%", left: "52%", big: true },
  { c: "Nakuru", n: 31, top: "50%", left: "40%" },
  { c: "Kisumu", n: 43, top: "54%", left: "22%" },
  { c: "Mombasa", n: 89, top: "84%", left: "78%" },
];

const EXPLORE = [
  { t: "Events", s: "93 happening today", ic: <IcStar />, bg: "linear-gradient(135deg,#FFB020,#FF7A59)" },
  { t: "People Nearby", s: "487 around you", ic: <IcPin />, bg: "linear-gradient(135deg,#F5307E,#7A2FF2)" },
  { t: "Groups & Chat", s: "Start vibing", ic: <IcChat />, bg: "linear-gradient(135deg,#7A2FF2,#3B82F6)" },
  { t: "Hangouts", s: "Find your vibe", ic: <IcHeart />, bg: "linear-gradient(135deg,#FF7A59,#F5307E)" },
];

const FEATURES = [
  { t: "Real People", s: "Verified users only. No bots, no fake profiles.", ic: <IcUsers />, bg: "linear-gradient(135deg,#7A2FF2,#F5307E)" },
  { t: "Nearby & Global", s: "Find people near you or connect across East Africa.", ic: <IcPin />, bg: "linear-gradient(135deg,#F5307E,#FF7A59)" },
  { t: "Events & Plans", s: "Discover events and make plans with like-minded people.", ic: <IcCal />, bg: "linear-gradient(135deg,#FF7A59,#FFB020)" },
  { t: "Safe & Secure", s: "We prioritize your safety and privacy, always.", ic: <IcShield />, bg: "linear-gradient(135deg,#7A2FF2,#3B82F6)" },
];

const STEPS = [
  { n: 1, t: "Sign up", s: "Create your profile in seconds." },
  { n: 2, t: "Explore", s: "See people, events and places nearby." },
  { n: 3, t: "Connect", s: "Chat, vibe and build real connections." },
  { n: 4, t: "Meet up", s: "Turn online vibes into real moments." },
];

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="vb-logo">
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <linearGradient id="vbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A59" />
            <stop offset="0.45" stopColor="#F5307E" />
            <stop offset="1" stopColor="#7A2FF2" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill="url(#vbg)" />
        <path d="M256 96 C181 96 120 157 120 232 C120 316 200 360 256 424 C312 360 392 316 392 232 C392 157 331 96 256 96 Z" fill="#fff" />
        <path d="M168 216 L210 216 L232 172 L262 268 L292 184 L314 216 L356 216" fill="none" stroke="#7A2FF2" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="vb-word">Vibely</span>
    </span>
  );
}

function AvatarStack({ label }: { label: string }) {
  return (
    <div className="vb-social">
      <div className="vb-avstack">
        {STACK.map((src, i) => (
          <img key={i} src={src} alt="" className="vb-av" />
        ))}
      </div>
      <span className="vb-social-t">
        <span className="vb-live-dot" /> {label}
      </span>
    </div>
  );
}

function fmtNum(v: number, fmt: Stat["fmt"]) {
  if (fmt === "comma") return v.toLocaleString("en-US");
  if (fmt === "k") return (v >= 1000 ? Math.round(v / 1000) + "K+" : String(v));
  return String(v);
}

/* ------------------------------------------------------------------ */
/*  Kenya map panel                                                    */
/* ------------------------------------------------------------------ */
function KenyaMap() {
  return (
    <div className="vb-map vb-reveal">
      <div className="vb-map-head">
        <span className="vb-map-live"><span className="vb-live-dot" /> Live map</span>
        <span className="vb-map-loc">Kenya · East Africa</span>
      </div>
      <div className="vb-map-body">
        <svg className="vb-map-svg" viewBox="0 0 400 380" aria-hidden="true">
          <defs>
            <linearGradient id="vbland" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7A2FF2" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#F5307E" stopOpacity="0.45" />
              <stop offset="1" stopColor="#FF7A59" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="vbmapglow" cx="52%" cy="60%" r="60%">
              <stop offset="0" stopColor="#F5307E" stopOpacity="0.5" />
              <stop offset="1" stopColor="#F5307E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="400" height="380" fill="url(#vbmapglow)" />
          {/* stylised Kenya landmass */}
          <path
            className="vb-land"
            d="M70 96 L150 74 L214 66 L300 92 L340 150 L318 210 L300 250 L250 316 L196 344 L150 330 L112 312 L92 276 L78 236 L64 196 L58 150 Z"
            fill="url(#vbland)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
          />
          {/* network connectors */}
          <g className="vb-links" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none">
            <line x1="208" y1="236" x2="160" y2="190" />
            <line x1="208" y1="236" x2="88" y2="205" />
            <line x1="208" y1="236" x2="312" y2="320" />
          </g>
        </svg>
        {CITIES.map((c) => (
          <span key={c.c} className={"vb-city" + (c.big ? " big" : "")} style={{ top: c.top, left: c.left }}>
            <span className="vb-city-pulse" />
            <span className="vb-city-pin" />
            <span className="vb-city-tag">
              <b>{c.c}</b>
              <small>{c.n}</small>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phone mockup (mini Vibely app)                                     */
/* ------------------------------------------------------------------ */
function Phone() {
  return (
    <div className="vb-phone-wrap vb-reveal">
      <div className="vb-phone">
        <span className="vb-phone-notch" />
        <div className="vb-app">
          <div className="vb-app-bar">
            <span className="vb-app-time">9:41</span>
            <span className="vb-app-sig"><i /><i /><i /><i /></span>
          </div>
          <div className="vb-app-head">
            <span className="vb-app-brand"><Logo size={20} /></span>
            <span className="vb-app-loc"><IcPin /> Nairobi</span>
          </div>
          <div className="vb-app-hello">
            <div>
              <small>Good morning, Aisha</small>
              <b>People &amp; vibes near you</b>
            </div>
            <span className="vb-app-online"><IcBolt /> 2,834</span>
          </div>
          <div className="vb-app-label">People near you</div>
          <div className="vb-app-people">
            {[
              { src: IMG.jane, n: "Aisha, 22", d: "300m" },
              { src: IMG.kevin, n: "Brian, 25", d: "1.2km" },
              { src: IMG.ashley, n: "Mercy, 24", d: "2.1km" },
            ].map((p) => (
              <div className="vb-pcard" key={p.n}>
                <img src={p.src} alt="" />
                <span className="vb-pdot" />
                <span className="vb-pcap">
                  <b>{p.n}</b>
                  <small><IcPin /> {p.d}</small>
                </span>
                <span className="vb-pheart"><IcHeart /></span>
              </div>
            ))}
          </div>
          <div className="vb-app-event">
            <span className="vb-ev-img" style={{ background: "linear-gradient(135deg,#F5307E,#7A2FF2)" }}><IcStar /></span>
            <span className="vb-ev-tx">
              <b>Sarabi Rooftop Sundowner</b>
              <small>Today · 7:00 PM · CBD</small>
            </span>
            <span className="vb-ev-go">Join</span>
          </div>
          <div className="vb-app-nav">
            <span className="on"><IcUsers /></span>
            <span><IcPin /></span>
            <span className="vb-app-fab"><IcHeart /></span>
            <span><IcChat /></span>
            <span><IcStar /></span>
          </div>
        </div>
      </div>

      {/* floating glass cards */}
      <div className="vb-float vb-float-1">
        <img src={IMG.mike} alt="Mike" />
        <span className="vb-float-cap">
          <b>Mike, 27</b>
          <small><span className="vb-live-dot" /> 1.1km away</small>
        </span>
      </div>
      <div className="vb-float vb-float-2">
        <img src={IMG.ashley} alt="Ashley" />
        <span className="vb-float-cap">
          <b>Ashley, 23</b>
          <small><span className="vb-live-dot" /> Online</small>
        </span>
      </div>
      <span className="vb-badge vb-badge-heart"><IcHeart /></span>
      <span className="vb-badge vb-badge-fire"><IcBolt /></span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const rootRef = useRef<HTMLElement>(null);
  const [tick, setTick] = useState(0);

  // rotating activity ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % ACTIVITY.length), 2800);
    return () => clearInterval(id);
  }, []);

  // count-up stats + scroll reveal + live online jitter
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reveal
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>(".vb-reveal"));
    if (reduce) {
      revealEls.forEach((el) => el.classList.add("vb-in"));
    } else {
      const ro = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("vb-in"), ro.unobserve(e.target))),
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => ro.observe(el));
    }

    // count-up
    const nums = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));
    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      const fmt = (el.dataset.fmt || "plain") as Stat["fmt"];
      if (reduce) {
        el.textContent = fmtNum(target, fmt);
        return;
      }
      const dur = 1500;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmtNum(Math.round(target * eased), fmt);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmtNum(target, fmt);
      };
      requestAnimationFrame(step);
    };
    const co = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !(e.target as HTMLElement).dataset.done) {
            (e.target as HTMLElement).dataset.done = "1";
            runCount(e.target as HTMLElement);
            co.unobserve(e.target);
          }
        }),
      { threshold: 0.5 }
    );
    nums.forEach((n) => co.observe(n));

    // subtle "live" jitter on the online-now counter
    let liveVal = 2834;
    let liveId: number | undefined;
    if (!reduce) {
      liveId = window.setInterval(() => {
        const el = root.querySelector<HTMLElement>('[data-live="1"]');
        if (!el || !el.dataset.done) return;
        liveVal += Math.floor(Math.random() * 5) - 1;
        el.textContent = fmtNum(liveVal, "comma");
        el.classList.remove("vb-flash");
        void el.offsetWidth;
        el.classList.add("vb-flash");
      }, 3500);
    }

    return () => {
      co.disconnect();
      if (liveId) clearInterval(liveId);
    };
  }, []);

  const act = ACTIVITY[tick];

  return (
    <main className="vb" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* animated gradient stage */}
      <div className="vb-stage-bg" aria-hidden="true">
        <span className="vb-blob b1" />
        <span className="vb-blob b2" />
        <span className="vb-blob b3" />
        <span className="vb-blob b4" />
        <span className="vb-grid" />
      </div>

      {/* nav */}
      <header className="vb-nav">
        <Logo size={32} />
        <nav className="vb-nav-links">
          <a href="#why">Features</a>
          <a href="#how">How it works</a>
          <a href="#safe">Safety</a>
        </nav>
        <div className="vb-nav-r">
          <span className="vb-country"><IcPin /> Kenya</span>
          <Link href="/sign-in" className="vb-login">Log in</Link>
          <Link href="/sign-in" className="vb-btn vb-btn-sm">Join Free</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="vb-hero">
        <div className="vb-hero-l">
          <span className="vb-pill"><IcHeart /> Made in Kenya, for East Africa</span>
          <h1 className="vb-h1">
            Meet <span className="grad">real people</span><br />near you.
          </h1>
          <p className="vb-lead">
            Dating, friends, hangouts and networking — one app to find your people
            across Kenya and East Africa. Your next friend, date or adventure is
            closer than you think.
          </p>

          {/* live activity ticker */}
          <div className={"vb-ticker tone-" + act.tone} key={tick}>
            <span className="vb-ticker-ic">{act.ic}</span>
            <span className="vb-ticker-tx"><b>{act.a}</b> {act.t}</span>
            <span className="vb-ticker-when">{act.when}</span>
          </div>

          <div className="vb-cta">
            <Link href="/sign-in" className="vb-btn vb-btn-lg">Join Free <IcArrow /></Link>
            <Link href="/sign-in" className="vb-ghost"><IcPin /> See who&apos;s nearby</Link>
          </div>

          <AvatarStack label="2,834+ people online right now" />

          <div className="vb-stores">
            <span className="vb-store"><IcPlay /><span><small>GET IT ON</small><b>Google Play</b></span></span>
            <span className="vb-store"><IcApple /><span><small>Download on the</small><b>App Store</b></span></span>
          </div>
        </div>

        <div className="vb-hero-r">
          <div className="vb-stage">
            <KenyaMap />
            <Phone />
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="vb-stats vb-reveal">
        {STATS.map((s) => (
          <div className="vb-stat" key={s.label}>
            <span className="vb-stat-ic">{s.ic}</span>
            <b className="vb-stat-n" data-count={s.target} data-fmt={s.fmt} data-live={s.live ? "1" : undefined}>0</b>
            <small>{s.label}</small>
          </div>
        ))}
      </section>

      {/* EXPLORE */}
      <section className="vb-light">
        <div className="vb-wrap">
          <div className="vb-row-head vb-reveal">
            <h2 className="vb-h2">Explore what&apos;s <span className="grad">happening</span></h2>
            <Link href="/sign-in" className="vb-seeall">View all <IcArrow /></Link>
          </div>
          <div className="vb-explore">
            {EXPLORE.map((e, i) => (
              <div className="vb-exp vb-reveal" style={{ transitionDelay: i * 70 + "ms" }} key={e.t}>
                <span className="vb-exp-ic" style={{ background: e.bg }}>{e.ic}</span>
                <b>{e.t}</b>
                <small>{e.s}</small>
              </div>
            ))}
          </div>

          {/* WHY */}
          <div id="why" className="vb-two">
            <div className="vb-reveal">
              <h2 className="vb-h2">Why you&apos;ll love <span className="grad">Vibely</span></h2>
              <div className="vb-feats">
                {FEATURES.map((f, i) => (
                  <div className="vb-feat vb-reveal" style={{ transitionDelay: i * 70 + "ms" }} key={f.t}>
                    <span className="vb-feat-ic" style={{ background: f.bg }}>{f.ic}</span>
                    <div>
                      <b>{f.t}</b>
                      <small>{f.s}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div id="how" className="vb-reveal">
              <h2 className="vb-h2">How <span className="grad">Vibely</span> works</h2>
              <div className="vb-steps">
                {STEPS.map((st, i) => (
                  <div className="vb-step vb-reveal" style={{ transitionDelay: i * 70 + "ms" }} key={st.n}>
                    <span className="vb-step-n">{st.n}</span>
                    <div>
                      <b>{st.t}</b>
                      <small>{st.s}</small>
                    </div>
                    {st.n < 4 && <span className="vb-step-line" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* quote */}
          <div className="vb-quote vb-reveal">
            <div className="vb-avstack">
              {STACK.slice(0, 4).map((src, i) => (
                <img key={i} src={src} alt="" className="vb-av" />
              ))}
            </div>
            <p>
              &ldquo;I found amazing friends and real memories on Vibely.&rdquo;
              <span>— Brian, Nairobi</span>
            </p>
          </div>

          {/* final CTA */}
          <div id="safe" className="vb-final vb-reveal">
            <span className="vb-final-ic"><IcShield /></span>
            <div className="vb-final-tx">
              <b>Safe. Respectful. <span className="grad">Real.</span></b>
              <small>Verified profiles, privacy controls, and a community built to make everyone feel welcome across East Africa.</small>
            </div>
            <div className="vb-final-cta">
              <div className="vb-trust">
                <span><IcCheck /> Verified people</span>
                <span><IcLock /> Safe &amp; secure</span>
              </div>
              <Link href="/sign-in" className="vb-btn vb-btn-lg">Join Vibely for Free <IcArrow /></Link>
            </div>
          </div>

          <p className="vb-foot">Made in Kenya · for Kenya &amp; East Africa</p>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Scoped styles                                                      */
/* ------------------------------------------------------------------ */
const CSS = `
.vb{--v:#7A2FF2;--m:#F5307E;--c:#FF7A59;--a:#FFB020;--b:#3B82F6;
  --ink:#150b2e;--ink2:#5b5470;--glass:rgba(255,255,255,.08);--glass-b:rgba(255,255,255,.18);
  position:relative;overflow:hidden;color:#fff;background:#0b0518;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;}
.vb *{box-sizing:border-box;margin:0;padding:0}
.vb a{text-decoration:none;color:inherit}
.vb img{display:block;max-width:100%}
.vb .grad{background:linear-gradient(100deg,#FF9A6C,#F5307E 45%,#B98BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.vb svg{width:1em;height:1em}

/* animated gradient stage */
.vb-stage-bg{position:absolute;inset:0;z-index:0;overflow:hidden;background:
  radial-gradient(120% 90% at 50% -10%,#1b0d3e 0%,#0b0518 60%)}
.vb-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;mix-blend-mode:screen;animation:vbfloat 18s ease-in-out infinite}
.vb-blob.b1{width:46vw;height:46vw;left:-8vw;top:-6vw;background:#7A2FF2}
.vb-blob.b2{width:42vw;height:42vw;right:-6vw;top:-4vw;background:#F5307E;animation-duration:22s;animation-delay:-4s}
.vb-blob.b3{width:40vw;height:40vw;left:14vw;top:24vw;background:#FF7A59;animation-duration:26s;animation-delay:-8s}
.vb-blob.b4{width:38vw;height:38vw;right:6vw;top:20vw;background:#3B82F6;animation-duration:24s;animation-delay:-12s}
.vb-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(80% 60% at 50% 30%,#000,transparent 90%)}
@keyframes vbfloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(4vw,3vw) scale(1.08)}66%{transform:translate(-3vw,2vw) scale(.96)}}

/* layout wrappers */
.vb-nav,.vb-hero,.vb-stats,.vb-wrap{position:relative;z-index:2}
.vb-nav{max-width:1200px;margin:0 auto;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.vb-logo{display:inline-flex;align-items:center;gap:9px}
.vb-logo svg{border-radius:9px}
.vb-word{font-weight:800;font-size:22px;letter-spacing:-.02em;background:linear-gradient(90deg,#FF9A6C,#F5307E,#B98BFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.vb-nav-links{display:flex;gap:26px;font-size:15px;color:rgba(255,255,255,.75)}
.vb-nav-links a:hover{color:#fff}
.vb-nav-r{display:flex;align-items:center;gap:14px}
.vb-country{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:rgba(255,255,255,.7)}
.vb-country svg{color:var(--m)}
.vb-login{font-size:15px;color:rgba(255,255,255,.85);font-weight:600}
.vb-login:hover{color:#fff}

.vb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;color:#fff;
  background:linear-gradient(100deg,#FF7A59,#F5307E 55%,#7A2FF2);border-radius:999px;
  box-shadow:0 10px 30px -8px rgba(245,48,126,.6);transition:transform .18s,box-shadow .18s;white-space:nowrap}
.vb-btn:hover{transform:translateY(-2px);box-shadow:0 16px 40px -10px rgba(245,48,126,.75)}
.vb-btn-sm{padding:10px 18px;font-size:14px}
.vb-btn-lg{padding:15px 26px;font-size:16px}
.vb-btn-lg svg{width:18px;height:18px}

/* hero */
.vb-hero{max-width:1200px;margin:0 auto;padding:26px 24px 20px;display:grid;grid-template-columns:1.02fr 1.15fr;gap:34px;align-items:center}
.vb-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;
  background:var(--glass);border:1px solid var(--glass-b);backdrop-filter:blur(10px);color:#fff}
.vb-pill svg{color:var(--m);width:15px;height:15px}
.vb-h1{margin:18px 0 0;font-size:clamp(38px,5vw,62px);line-height:1.02;font-weight:850;letter-spacing:-.03em}
.vb-lead{margin:18px 0 0;max-width:30em;font-size:17px;line-height:1.6;color:rgba(255,255,255,.72)}

.vb-ticker{margin-top:20px;display:inline-flex;align-items:center;gap:11px;padding:10px 14px;border-radius:14px;
  background:var(--glass);border:1px solid var(--glass-b);backdrop-filter:blur(12px);animation:vbslidein .5s ease both}
.vb-ticker-ic{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;color:#fff;flex:none}
.vb-ticker.tone-v .vb-ticker-ic{background:linear-gradient(135deg,#7A2FF2,#3B82F6)}
.vb-ticker.tone-m .vb-ticker-ic{background:linear-gradient(135deg,#F5307E,#7A2FF2)}
.vb-ticker.tone-c .vb-ticker-ic{background:linear-gradient(135deg,#FF7A59,#F5307E)}
.vb-ticker.tone-b .vb-ticker-ic{background:linear-gradient(135deg,#3B82F6,#7A2FF2)}
.vb-ticker-ic svg{width:16px;height:16px}
.vb-ticker-tx{font-size:14px;color:rgba(255,255,255,.9)}
.vb-ticker-tx b{color:#fff}
.vb-ticker-when{margin-left:4px;font-size:12px;color:rgba(255,255,255,.5)}
@keyframes vbslidein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.vb-cta{margin-top:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.vb-ghost{display:inline-flex;align-items:center;gap:8px;padding:14px 20px;border-radius:999px;font-weight:600;font-size:15px;
  background:var(--glass);border:1px solid var(--glass-b);backdrop-filter:blur(10px);color:#fff;transition:background .18s}
.vb-ghost:hover{background:rgba(255,255,255,.16)}
.vb-ghost svg{color:var(--m);width:17px;height:17px}

.vb-social{margin-top:22px;display:flex;align-items:center;gap:12px}
.vb-avstack{display:flex}
.vb-av{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.9);margin-left:-11px;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.vb-av:first-child{margin-left:0}
.vb-social-t{font-size:14px;color:rgba(255,255,255,.72);display:inline-flex;align-items:center;gap:7px}
.vb-live-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:vbpulse 1.8s infinite}
@keyframes vbpulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}

.vb-stores{margin-top:22px;display:flex;gap:12px;flex-wrap:wrap}
.vb-store{display:inline-flex;align-items:center;gap:10px;padding:9px 16px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14)}
.vb-store svg{width:20px;height:20px}
.vb-store small{display:block;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.vb-store b{display:block;font-size:14px}

/* hero-right stage */
.vb-hero-r{position:relative}
.vb-stage{position:relative;height:560px}
.vb-reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.vb-reveal.vb-in{opacity:1;transform:none}

/* map */
.vb-map{position:absolute;top:6px;right:-6px;width:300px;height:320px;border-radius:22px;overflow:hidden;
  background:rgba(255,255,255,.06);border:1px solid var(--glass-b);backdrop-filter:blur(8px);
  box-shadow:0 30px 60px -24px rgba(0,0,0,.6)}
.vb-map-head{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:12px 14px}
.vb-map-live{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600}
.vb-map-loc{font-size:11px;color:rgba(255,255,255,.6)}
.vb-map-body{position:absolute;inset:0}
.vb-map-svg{position:absolute;inset:0;width:100%;height:100%}
.vb-land{animation:vbland 8s ease-in-out infinite}
@keyframes vbland{0%,100%{filter:drop-shadow(0 0 10px rgba(245,48,126,.3))}50%{filter:drop-shadow(0 0 22px rgba(245,48,126,.55))}}
.vb-links line{stroke-dasharray:4 6;animation:vbdash 6s linear infinite}
@keyframes vbdash{to{stroke-dashoffset:-40}}
.vb-city{position:absolute;transform:translate(-50%,-50%);z-index:2}
.vb-city-pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:50%;
  background:#fff;box-shadow:0 0 0 3px rgba(245,48,126,.9),0 0 12px rgba(245,48,126,.9)}
.vb-city.big .vb-city-pin{width:15px;height:15px;box-shadow:0 0 0 4px rgba(245,48,126,1),0 0 18px rgba(245,48,126,1)}
.vb-city-pulse{position:absolute;top:50%;left:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);
  background:rgba(245,48,126,.5);animation:vbcity 2.4s ease-out infinite}
.vb-city.big .vb-city-pulse{animation-duration:2s}
@keyframes vbcity{0%{transform:translate(-50%,-50%) scale(.6);opacity:.8}100%{transform:translate(-50%,-50%) scale(4.4);opacity:0}}
.vb-city-tag{position:absolute;left:16px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;
  padding:4px 9px;border-radius:9px;background:rgba(10,4,24,.72);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(6px);white-space:nowrap}
.vb-city-tag b{font-size:12px}
.vb-city-tag small{font-size:11px;color:#7CF0A6;font-weight:700}

/* phone */
.vb-phone-wrap{position:absolute;left:8px;bottom:0;z-index:3}
.vb-phone{width:250px;height:512px;border-radius:40px;padding:11px;background:linear-gradient(160deg,#241246,#120726);
  border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 80px -24px rgba(0,0,0,.7),0 0 0 8px rgba(255,255,255,.03);
  transform:rotate(-4deg);animation:vbsway 7s ease-in-out infinite;position:relative}
@keyframes vbsway{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(-1.2deg) translateY(-8px)}}
.vb-phone-notch{position:absolute;top:16px;left:50%;transform:translateX(-50%);width:96px;height:20px;border-radius:12px;background:#0c0620;z-index:5}
.vb-app{height:100%;border-radius:30px;overflow:hidden;background:linear-gradient(180deg,#f4f1fb,#efeafc);color:#1a1030;display:flex;flex-direction:column}
.vb-app-bar{display:flex;justify-content:space-between;align-items:center;padding:11px 18px 4px;font-size:11px;font-weight:700;color:#1a1030}
.vb-app-sig{display:flex;gap:2px;align-items:flex-end}
.vb-app-sig i{width:3px;background:#1a1030;border-radius:1px}
.vb-app-sig i:nth-child(1){height:5px}.vb-app-sig i:nth-child(2){height:7px}.vb-app-sig i:nth-child(3){height:9px}.vb-app-sig i:nth-child(4){height:11px}
.vb-app-head{display:flex;justify-content:space-between;align-items:center;padding:6px 16px 2px}
.vb-app-brand .vb-word{font-size:15px}
.vb-app-brand svg{border-radius:6px}
.vb-app-loc{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#1a1030}
.vb-app-loc svg{width:12px;height:12px;color:var(--v)}
.vb-app-hello{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px 4px}
.vb-app-hello small{font-size:10px;color:#6b6480}
.vb-app-hello b{font-size:14px;display:block;line-height:1.2;color:#1a1030}
.vb-app-online{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:var(--m);background:#fff;padding:6px 9px;border-radius:10px;box-shadow:0 4px 12px rgba(122,47,242,.14)}
.vb-app-online svg{width:12px;height:12px;color:var(--c)}
.vb-app-label{padding:8px 16px 6px;font-size:12px;font-weight:800;color:#1a1030}
.vb-app-people{display:flex;gap:8px;padding:0 16px;overflow:hidden}
.vb-pcard{position:relative;flex:none;width:96px;height:120px;border-radius:14px;overflow:hidden;box-shadow:0 8px 18px rgba(30,10,60,.16)}
.vb-pcard img{width:100%;height:100%;object-fit:cover}
.vb-pdot{position:absolute;top:8px;right:8px;width:9px;height:9px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.vb-pcap{position:absolute;left:8px;bottom:8px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.vb-pcap b{font-size:11px;display:block}
.vb-pcap small{font-size:9px;display:inline-flex;align-items:center;gap:2px;opacity:.9}
.vb-pcap small svg{width:8px;height:8px}
.vb-pheart{position:absolute;right:7px;bottom:7px;width:20px;height:20px;border-radius:50%;background:#fff;display:grid;place-items:center;color:var(--m)}
.vb-pheart svg{width:12px;height:12px;fill:var(--m);stroke:var(--m)}
.vb-app-event{margin:12px 14px 0;display:flex;align-items:center;gap:9px;padding:9px;border-radius:14px;background:linear-gradient(100deg,#fdeaf3,#f0e9fd)}
.vb-ev-img{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;color:#fff;flex:none}
.vb-ev-img svg{width:16px;height:16px;fill:#fff;stroke:#fff}
.vb-ev-tx{flex:1}
.vb-ev-tx b{font-size:11px;display:block;color:#1a1030}
.vb-ev-tx small{font-size:9.5px;color:#6b6480}
.vb-ev-go{font-size:11px;font-weight:800;color:#fff;background:linear-gradient(100deg,#F5307E,#7A2FF2);padding:6px 12px;border-radius:999px}
.vb-app-nav{margin-top:auto;display:flex;align-items:center;justify-content:space-around;padding:12px 14px;background:#fff;border-top:1px solid #efeafc}
.vb-app-nav>span{color:#b6adca;display:grid;place-items:center}
.vb-app-nav>span svg{width:19px;height:19px}
.vb-app-nav .on{color:var(--v)}
.vb-app-fab{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F5307E,#7A2FF2);color:#fff!important;box-shadow:0 8px 18px rgba(245,48,126,.4);margin-top:-24px}
.vb-app-fab svg{fill:#fff;stroke:#fff}

/* floating cards */
.vb-float{position:absolute;z-index:4;display:flex;align-items:center;gap:9px;padding:9px 12px 9px 9px;border-radius:16px;
  background:rgba(255,255,255,.14);border:1px solid var(--glass-b);backdrop-filter:blur(14px);
  box-shadow:0 20px 40px -14px rgba(0,0,0,.5)}
.vb-float img{width:40px;height:40px;border-radius:12px;object-fit:cover}
.vb-float-cap b{font-size:13px;display:block}
.vb-float-cap small{font-size:11px;color:rgba(255,255,255,.75);display:inline-flex;align-items:center;gap:5px}
.vb-float-1{left:-18px;top:120px;animation:vbfloatcard 6s ease-in-out infinite}
.vb-float-2{right:2px;bottom:150px;animation:vbfloatcard 7s ease-in-out infinite;animation-delay:-2s}
@keyframes vbfloatcard{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.vb-badge{position:absolute;z-index:4;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:#fff;
  box-shadow:0 12px 26px -8px rgba(0,0,0,.5)}
.vb-badge svg{width:20px;height:20px;fill:#fff;stroke:#fff}
.vb-badge-heart{right:34px;top:78px;background:linear-gradient(135deg,#F5307E,#FF7A59);animation:vbfloatcard 5s ease-in-out infinite}
.vb-badge-fire{left:38px;bottom:96px;background:linear-gradient(135deg,#FFB020,#FF7A59);animation:vbfloatcard 6.5s ease-in-out infinite;animation-delay:-1.5s}

/* stats */
.vb-stats{max-width:1000px;margin:18px auto 8px;padding:0 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.vb-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:20px 12px;border-radius:18px;
  background:var(--glass);border:1px solid var(--glass-b);backdrop-filter:blur(12px);text-align:center}
.vb-stat-ic{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;margin-bottom:4px;color:#fff;
  background:linear-gradient(135deg,rgba(122,47,242,.9),rgba(245,48,126,.9))}
.vb-stat-ic svg{width:18px;height:18px}
.vb-stat-n{font-size:26px;font-weight:850;letter-spacing:-.02em}
.vb-stat small{font-size:12px;color:rgba(255,255,255,.65)}
.vb-flash{animation:vbflash .5s ease}
@keyframes vbflash{0%{color:#7CF0A6}100%{color:#fff}}

/* light section */
.vb-light{position:relative;z-index:2;margin-top:40px;background:linear-gradient(180deg,#faf8ff,#f4f0fe);color:var(--ink);border-radius:34px 34px 0 0;padding:52px 0 40px}
.vb-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.vb-h2{font-size:clamp(24px,3vw,34px);font-weight:850;letter-spacing:-.02em;color:var(--ink)}
.vb-row-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
.vb-seeall{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:var(--v)}
.vb-seeall svg{width:15px;height:15px}
.vb-explore{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.vb-exp{padding:22px 18px;border-radius:20px;background:rgba(255,255,255,.75);border:1px solid rgba(122,47,242,.1);
  box-shadow:0 16px 34px -22px rgba(80,30,140,.35);backdrop-filter:blur(6px);transition:transform .2s,box-shadow .2s}
.vb-exp:hover{transform:translateY(-4px);box-shadow:0 24px 44px -22px rgba(80,30,140,.5)}
.vb-exp-ic{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;color:#fff;margin-bottom:12px}
.vb-exp-ic svg{width:22px;height:22px}
.vb-exp b{font-size:16px;display:block;color:var(--ink)}
.vb-exp small{font-size:13px;color:var(--ink2)}

.vb-two{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:52px}
.vb-feats{margin-top:18px;display:flex;flex-direction:column;gap:12px}
.vb-feat{display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:18px;background:rgba(255,255,255,.72);border:1px solid rgba(122,47,242,.09);box-shadow:0 12px 30px -24px rgba(80,30,140,.4)}
.vb-feat-ic{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;color:#fff;flex:none}
.vb-feat-ic svg{width:21px;height:21px}
.vb-feat b{font-size:15px;color:var(--ink)}
.vb-feat small{display:block;font-size:13px;color:var(--ink2);margin-top:2px}
.vb-steps{margin-top:18px;display:flex;flex-direction:column;gap:6px}
.vb-step{position:relative;display:flex;gap:14px;align-items:flex-start;padding:14px 16px}
.vb-step-n{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;font-weight:800;color:#fff;flex:none;
  background:linear-gradient(135deg,#7A2FF2,#F5307E);box-shadow:0 8px 18px -6px rgba(245,48,126,.5);z-index:1}
.vb-step b{font-size:15px;color:var(--ink)}
.vb-step small{display:block;font-size:13px;color:var(--ink2);margin-top:2px}
.vb-step-line{position:absolute;left:33px;top:46px;width:2px;height:26px;background:linear-gradient(#F5307E,rgba(245,48,126,.15))}

.vb-quote{margin-top:48px;display:flex;align-items:center;gap:18px;padding:26px;border-radius:22px;flex-wrap:wrap;
  background:linear-gradient(100deg,rgba(122,47,242,.08),rgba(245,48,126,.08));border:1px solid rgba(122,47,242,.12)}
.vb-quote .vb-av{border-color:#fff}
.vb-quote p{font-size:19px;font-weight:600;color:var(--ink);line-height:1.4}
.vb-quote span{display:block;margin-top:6px;font-size:14px;font-weight:600;color:var(--v)}

.vb-final{margin-top:40px;display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding:30px;border-radius:26px;color:#fff;
  background:linear-gradient(115deg,#7A2FF2,#F5307E 60%,#FF7A59);box-shadow:0 30px 60px -26px rgba(245,48,126,.6)}
.vb-final-ic{display:grid;place-items:center;width:60px;height:60px;border-radius:18px;background:rgba(255,255,255,.16);flex:none}
.vb-final-ic svg{width:28px;height:28px;stroke:#fff}
.vb-final-tx{flex:1;min-width:220px}
.vb-final-tx b{font-size:23px;display:block}
.vb-final-tx .grad{background:linear-gradient(90deg,#fff,#FFE0B2);-webkit-background-clip:text;background-clip:text;color:transparent}
.vb-final-tx small{display:block;margin-top:6px;font-size:14px;color:rgba(255,255,255,.85);max-width:40em}
.vb-final-cta{display:flex;flex-direction:column;gap:12px;align-items:flex-end}
.vb-final-cta .vb-btn{background:#fff;color:#7A2FF2;box-shadow:0 12px 30px -10px rgba(0,0,0,.4)}
.vb-final-cta .vb-btn:hover{box-shadow:0 18px 40px -12px rgba(0,0,0,.5)}
.vb-trust{display:flex;gap:16px;flex-wrap:wrap}
.vb-trust span{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.9)}
.vb-trust svg{width:15px;height:15px}
.vb-foot{margin-top:34px;text-align:center;font-size:13px;color:var(--ink2)}

/* responsive */
@media(max-width:960px){
  .vb-hero{grid-template-columns:1fr;gap:10px}
  .vb-hero-r{order:2}
  .vb-stage{height:600px;margin-top:8px;transform:scale(.96)}
  .vb-map{right:auto;left:50%;transform:translateX(-24%)}
  .vb-phone-wrap{left:50%;transform:translateX(-58%)}
  .vb-nav-links{display:none}
  .vb-two{grid-template-columns:1fr;gap:40px}
  .vb-explore{grid-template-columns:repeat(2,1fr)}
  .vb-stats{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:600px){
  .vb-nav{padding:16px}
  .vb-country{display:none}
  .vb-h1{font-size:36px}
  .vb-stage{height:540px;transform:scale(.9);transform-origin:top center}
  .vb-map{width:270px;height:290px}
  .vb-phone{width:230px;height:472px}
  .vb-float-1{left:-6px;top:100px}
  .vb-float-2{right:-6px}
  .vb-final-cta{align-items:stretch;width:100%}
  .vb-final-cta .vb-btn{justify-content:center}
  .vb-stores{gap:8px}
}
@media(prefers-reduced-motion:reduce){
  .vb-blob,.vb-phone,.vb-float,.vb-badge,.vb-land,.vb-city-pulse,.vb-live-dot,.vb-links line{animation:none!important}
  .vb-reveal{opacity:1;transform:none}
}
`;
