import Link from "next/link";
import Image from "next/image";
import LandingMobileNav from "@/components/LandingMobileNav";
import SiteFooter from "@/components/SiteFooter";
import { SITE, hasStoreLinks } from "@/lib/site";

/* ---------------------------------------------------------------------------
   One responsive page.

   This used to be two complete DOM trees — .lp2-mobile and .lp2-desktop —
   swapped with display:none at 900px. Every visitor downloaded both, the copy
   in the two had already drifted apart (the 487-vs-24.8K bug), and Features,
   How it works and Safety existed only on desktop. Phones are where most of
   this audience reads the page, so they were being shown the thinnest version
   of the pitch. There is now one tree that scales.
   --------------------------------------------------------------------------- */

const IMG = {
  jane: "/landing/jane.jpg",
  kevin: "/landing/kevin.jpg",
  ashley: "/landing/ashley.jpg",
  mike: "/landing/mike.jpg",
};
const STACK = [IMG.jane, IMG.kevin, IMG.ashley, IMG.mike];

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
const IcFlag = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M5 21V4M5 4h13l-2.5 4L18 12H5" />
  </svg>
);
const IcBlock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </svg>
);

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="lpg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7A59" />
          <stop offset="0.45" stopColor="#F5307E" />
          <stop offset="1" stopColor="#7A2FF2" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#lpg)" />
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
  );
}

/* ----------------------------- content ----------------------------------- */

const ASSURANCES = [
  {
    t: "Verified profiles",
    s: "Members confirm they are a real person",
    ic: <IcShield />,
  },
  {
    t: "Kenya & East Africa",
    s: "Built here, not adapted from elsewhere",
    ic: <IcPin />,
  },
  { t: "Free to join", s: "No card needed, ever", ic: <IcHeart /> },
  {
    t: "Privacy you control",
    s: "You choose what is shown, and to whom",
    ic: <IcLock />,
  },
];

const EXPLORE = [
  {
    t: "People nearby",
    s: "See who is around you, filtered by what you are both looking for.",
    ic: <IcPin />,
    bg: "linear-gradient(135deg,#F5307E,#7A2FF2)",
  },
  {
    t: "Events",
    s: "Find what is on this week, from rooftop sundowners to morning hikes.",
    ic: <IcStar />,
    bg: "linear-gradient(135deg,#FFB020,#FF7A59)",
  },
  {
    t: "Plans",
    s: "Post a plan of your own and see who wants to come along.",
    ic: <IcCal />,
    bg: "linear-gradient(135deg,#FF7A59,#F5307E)",
  },
  {
    t: "Chat",
    s: "Talk properly when you both want to, with voice notes and photos.",
    ic: <IcChat />,
    bg: "linear-gradient(135deg,#7A2FF2,#3B82F6)",
  },
];

const FEATURES = [
  {
    t: "Real people",
    s: "Profile verification and active moderation, so you know who you are talking to.",
    ic: <IcUsers />,
    bg: "linear-gradient(135deg,#7A2FF2,#F5307E)",
  },
  {
    t: "Nearby and beyond",
    s: "Find people in your area, or connect across Kenya and East Africa.",
    ic: <IcPin />,
    bg: "linear-gradient(135deg,#F5307E,#FF7A59)",
  },
  {
    t: "One app, four reasons",
    s: "Dating, friendship, hangouts or networking. You say which, and we match it.",
    ic: <IcHeart />,
    bg: "linear-gradient(135deg,#FF7A59,#FFB020)",
  },
  {
    t: "Safety built in",
    s: "Block, report and privacy controls on every profile, not buried in settings.",
    ic: <IcShield />,
    bg: "linear-gradient(135deg,#7A2FF2,#3B82F6)",
  },
];

const STEPS = [
  { n: 1, t: "Sign up", s: "Create your profile. It takes a minute." },
  { n: 2, t: "Say what you want", s: "Dating, friends, a hangout, or networking." },
  { n: 3, t: "Explore", s: "See people, events and plans near you." },
  { n: 4, t: "Meet up", s: "Turn a conversation into a real plan." },
];

/**
 * `flip` renders the label to the left of the dot. Pins in the right-hand
 * half of the map would otherwise push a nowrap label past the edge and get
 * clipped by the container's overflow on narrow screens.
 */
const CITIES = [
  { c: "Nairobi", n: "Where we started", top: "36%", left: "44%", big: true },
  { c: "Mombasa", n: "Growing", top: "68%", left: "74%", flip: true },
  { c: "Kisumu", n: "Growing", top: "30%", left: "17%" },
  { c: "Kampala", n: "Growing", top: "14%", left: "38%" },
];

const SAFETY = [
  {
    t: "Verification, reviewed by people",
    s: "A selfie, or a selfie and an ID, checked by our team before a badge appears.",
    ic: <IcShield />,
  },
  {
    t: "Block and report on every profile",
    s: "Blocking is immediate. Reports reach a moderator, and we never tell them who reported.",
    ic: <IcBlock />,
  },
  {
    t: "Your location stays yours",
    s: "Others see an approximate distance. One switch removes you from nearby entirely.",
    ic: <IcPin />,
  },
  {
    t: "Advice for meeting safely",
    s: "Written for the scams that actually happen here, not a generic checklist.",
    ic: <IcFlag />,
  },
];

/* ----------------------------- pieces ------------------------------------ */

function Trust() {
  return (
    <div className="lp-trust">
      <div className="lp-avatars">
        {STACK.map((src, i) => (
          <Image key={i} src={src} alt="" width={34} height={34} />
        ))}
      </div>
      <span className="lp-trust-t">Real people, from Nairobi and beyond</span>
    </div>
  );
}

function StoreLinks() {
  if (!hasStoreLinks) {
    return (
      <p className="lp-soon">
        <span className="lp-soon-tag">Coming soon</span>
        Android and iOS apps are on the way. Vibely works in your browser today.
      </p>
    );
  }
  return (
    <div className="lp-stores">
      {SITE.stores.googlePlay && (
        <a className="lp-store" href={SITE.stores.googlePlay}>
          <IcArrow />
          <span>
            <small>Get it on</small>
            <b>Google Play</b>
          </span>
        </a>
      )}
      {SITE.stores.appStore && (
        <a className="lp-store" href={SITE.stores.appStore}>
          <IcArrow />
          <span>
            <small>Download on the</small>
            <b>App Store</b>
          </span>
        </a>
      )}
    </div>
  );
}

function PhoneMock() {
  const minis = [
    { src: IMG.jane, n: "Sarah, 24", d: "300m away" },
    { src: IMG.kevin, n: "Kevin, 26", d: "1.2km away" },
  ];
  return (
    <div className="lp-visual">
      <span className="lp-phone-aura" aria-hidden="true" />
      <div className="lp-phone">
        <div className="lp-phone-top">
          <span className="lp-phone-word">Vibely</span>
          <span className="lp-phone-loc">
            <IcPin /> Nairobi
          </span>
        </div>

        <div className="lp-phone-grid">
          {minis.map((m, i) => (
            <div className="lp-mini" key={m.n}>
              <Image
                src={m.src}
                alt=""
                fill
                sizes="140px"
                priority={i === 0}
                style={{ objectFit: "cover" }}
              />
              <span className="lp-mini-cap">
                <b>{m.n}</b>
                <small>
                  <IcPin /> {m.d}
                </small>
              </span>
            </div>
          ))}
        </div>

        <div className="lp-phone-event">
          <span className="lp-phone-event-ic">
            <IcStar />
          </span>
          <span className="lp-phone-event-tx">
            <b>Sunset Rooftop Vibes</b>
            <small>Today, 6:00 PM · Nairobi</small>
          </span>
          <span className="lp-phone-event-go">Join</span>
        </div>
      </div>

      <p className="lp-caption">Illustration of the Vibely app</p>
    </div>
  );
}

/* ------------------------------ page ------------------------------------- */

export default function Landing() {
  return (
    <div className="lp">
      <a className="lp-skip" href="#main">
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-header-in">
          <Link href="/" className="lp-brand" aria-label="Vibely home">
            <Logo />
            <span className="lp-word">Vibely</span>
          </Link>

          <nav className="lp-nav" aria-label="Main">
            <a href="#explore">Explore</a>
            <a href="#why">Why Vibely</a>
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
          </nav>

          <div className="lp-header-actions">
            <Link href="/sign-in" className="lp-login">
              Log in
            </Link>
            <Link href="/sign-in" className="lp-btn lp-btn--primary lp-btn--sm">
              Join free
            </Link>
            <LandingMobileNav />
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------- hero + dark run ---------------- */}
        <div className="lp-surface lp-surface--dark">
          <div className="lp-wrap">
            <section className="lp-hero" aria-labelledby="hero-h">
              <div className="lp-hero-copy">
                <span className="lp-pill">
                  <span className="lp-flag" aria-hidden="true" />
                  Made in Kenya, for East Africa
                </span>

                <h1 className="lp-h1" id="hero-h">
                  Meet real people <span className="grad">near you.</span>
                </h1>

                <p className="lp-lead">
                  Dating, friends, hangouts and networking — one app to find
                  your people across Kenya and East Africa.
                </p>

                <div className="lp-cta">
                  <Link href="/sign-in" className="lp-btn lp-btn--primary">
                    Join Vibely for free <IcArrow />
                  </Link>
                  <Link href="/sign-in" className="lp-btn lp-btn--ghost">
                    <IcPin /> See who&apos;s nearby
                  </Link>
                </div>

                <Trust />
              </div>

              <PhoneMock />
            </section>

            <section
              className="lp-assure"
              aria-label="What Vibely promises"
            >
              {ASSURANCES.map((a) => (
                <div className="lp-assure-item" key={a.t}>
                  <span className="lp-assure-ic">{a.ic}</span>
                  <b>{a.t}</b>
                  <small>{a.s}</small>
                </div>
              ))}
            </section>

            <section
              className="lp-section"
              id="explore"
              aria-labelledby="explore-h"
            >
              <div className="lp-head">
                <span className="lp-eyebrow">What you can do here</span>
                <h2 className="lp-h2" id="explore-h">
                  Four ways to find your people.
                </h2>
                <p className="lp-sub">
                  Tell Vibely what you are looking for and the app shapes
                  itself around it.
                </p>
              </div>

              <div className="lp-grid">
                {EXPLORE.map((e) => (
                  <div className="lp-card" key={e.t}>
                    <span className="lp-card-ic" style={{ background: e.bg }}>
                      {e.ic}
                    </span>
                    <b>{e.t}</b>
                    <small>{e.s}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ---------------- light run ---------------- */}
        <div className="lp-surface lp-surface--light">
          <div className="lp-wrap">
            <section className="lp-section" id="why" aria-labelledby="why-h">
              <div className="lp-head lp-head--center">
                <span className="lp-eyebrow">Why Vibely</span>
                <h2 className="lp-h2" id="why-h">
                  Built for how people actually meet here.
                </h2>
              </div>

              <div className="lp-grid">
                {FEATURES.map((f) => (
                  <div className="lp-card" key={f.t}>
                    <span className="lp-card-ic" style={{ background: f.bg }}>
                      {f.ic}
                    </span>
                    <b>{f.t}</b>
                    <small>{f.s}</small>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="lp-section lp-section--tight"
              id="how"
              aria-labelledby="how-h"
            >
              <div className="lp-head lp-head--center">
                <span className="lp-eyebrow">How it works</span>
                <h2 className="lp-h2" id="how-h">
                  From sign-up to sitting down together.
                </h2>
              </div>

              <ol className="lp-steps">
                {STEPS.map((s) => (
                  <li className="lp-step" key={s.n}>
                    <span className="lp-step-n" aria-hidden="true">
                      {s.n}
                    </span>
                    <span className="lp-step-tx">
                      <b>{s.t}</b>
                      <small>{s.s}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="lp-section" aria-labelledby="where-h">
              <div className="lp-where">
                <div>
                  <span className="lp-eyebrow">Where we are</span>
                  <h2 className="lp-h2" id="where-h">
                    Starting in Nairobi, growing outward.
                  </h2>
                  <p className="lp-sub">
                    Vibely works anywhere in the region, and we are building
                    density one city at a time rather than pretending to be
                    everywhere at once.
                  </p>
                  <ul className="lp-cities">
                    {CITIES.map((c) => (
                      <li className="lp-city-chip" key={c.c}>
                        <span className="lp-city-dot" aria-hidden="true" />
                        {c.c} <span>· {c.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lp-map" role="img" aria-label="Map of East Africa showing Nairobi, Mombasa, Kisumu and Kampala">
                  <svg
                    className="lp-map-net"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="lpnet" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#F5307E" />
                        <stop offset="1" stopColor="#7A2FF2" />
                      </linearGradient>
                    </defs>
                    <g>
                      <line className="lp-net-line" x1="46" y1="36" x2="76" y2="68" />
                      <line className="lp-net-line" x1="46" y1="36" x2="18" y2="30" />
                      <line className="lp-net-line" x1="46" y1="36" x2="40" y2="14" />
                      <line className="lp-net-line" x1="18" y1="30" x2="40" y2="14" />
                    </g>
                    <g>
                      <line className="lp-net-flow" x1="46" y1="36" x2="76" y2="68" />
                      <line className="lp-net-flow" x1="46" y1="36" x2="18" y2="30" />
                      <line className="lp-net-flow" x1="46" y1="36" x2="40" y2="14" />
                    </g>
                  </svg>

                  {CITIES.map((c) => (
                    <span
                      key={c.c}
                      className={
                        "lp-pin" +
                        (c.big ? " lp-pin--big" : "") +
                        (c.flip ? " lp-pin--flip" : "")
                      }
                      style={{ top: c.top, left: c.left }}
                    >
                      <span className="lp-pin-dot" />
                      <span className="lp-pin-tx">
                        <b>{c.c}</b>
                        <small>{c.n}</small>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ---------------- closing dark run ---------------- */}
        <div className="lp-surface lp-surface--close">
          <div className="lp-wrap">
            <section className="lp-section" id="safety" aria-labelledby="safety-h">
              <div className="lp-safety">
                <div>
                  <span className="lp-eyebrow">Safety</span>
                  <h2 className="lp-h2" id="safety-h">
                    Safe. Respectful. <span className="grad">Real.</span>
                  </h2>
                  <p className="lp-sub">
                    Verification, moderation and privacy controls are part of
                    the product, not an afterthought bolted on later.
                  </p>
                  <div className="lp-cta">
                    <Link href="/safety" className="lp-btn lp-btn--ghost">
                      Read our safety guidance <IcArrow />
                    </Link>
                  </div>
                </div>

                <div className="lp-safety-list">
                  {SAFETY.map((s) => (
                    <div className="lp-safety-item" key={s.t}>
                      <span className="lp-safety-ic">{s.ic}</span>
                      <span>
                        <b>{s.t}</b>
                        <small>{s.s}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="lp-section lp-section--tight"
              id="story"
              aria-label="Why we built Vibely"
            >
              <div className="lp-note">
                <p>
                  We built Vibely in Nairobi because meeting people here still
                  happens mostly through friends of friends — and that leaves
                  out anyone who has just moved, just graduated, or simply
                  wants a wider circle than the one they inherited.
                </p>
                <span className="lp-note-by">The Vibely team, Nairobi</span>
              </div>
            </section>

            <section
              className="lp-section lp-section--tight"
              aria-labelledby="final-h"
            >
              <div className="lp-final">
                <span className="lp-eyebrow">Get started</span>
                <h2 className="lp-h2" id="final-h">
                  Your people are closer than you think.
                </h2>
                <p className="lp-sub">
                  Free to join, and it takes about a minute.
                </p>
                <div className="lp-cta">
                  <Link href="/sign-in" className="lp-btn lp-btn--primary">
                    Join Vibely for free <IcArrow />
                  </Link>
                </div>
                <StoreLinks />
              </div>
            </section>
          </div>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
