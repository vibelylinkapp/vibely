import Link from "next/link";

type Feature = {
  title: string;
  text: string;
  bg: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "People Nearby",
    text: "See verified people around you, filter by what you're here for, and make the first move.",
    bg: "linear-gradient(135deg,#7A2FF2,#F5307E)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Live Heatmap",
    text: "Watch the city light up in real time and head straight for where the energy is tonight.",
    bg: "linear-gradient(135deg,#F5307E,#FF7A59)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Trending events",
    text: "Sundowners, live bands, hikes and mixers across the region. Book your spot in a tap.",
    bg: "linear-gradient(135deg,#FF7A59,#FFB020)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
      </svg>
    ),
  },
  {
    title: "Plans & meetups",
    text: "Post a plan or join one. Gym partner, road trip, movie night, coffee run. Your call.",
    bg: "linear-gradient(135deg,#F5307E,#7A2FF2)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Verified & safe",
    text: "Photo and ID verification, privacy controls, blocking and reporting built in from day one.",
    bg: "linear-gradient(135deg,#16A34A,#22C55E)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Real-time chat",
    text: "Match, then talk. Photos, voice notes, reactions and read receipts. It all just works.",
    bg: "linear-gradient(135deg,#7A2FF2,#F5307E)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
      </svg>
    ),
  },
];

const STEPS: { n: string; title: string; text: string }[] = [
  {
    n: "1",
    title: "Create your profile",
    text: "Sign up in seconds, add a few photos and tell people what you're here for.",
  },
  {
    n: "2",
    title: "Discover what's around",
    text: "Browse people nearby, the live heatmap, trending events and open plans.",
  },
  {
    n: "3",
    title: "Match, chat & meet up",
    text: "Like, match and start talking. Then take it offline at a real hangout.",
  },
];

const CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Eldoret",
  "Kampala",
  "Kigali",
  "Dar es Salaam",
  "Arusha",
];

export default function Landing() {
  return (
    <main className="lp">
      <div className="glow" />

      <section className="hero">
        <div className="logo">
          <svg width="60" height="60" viewBox="0 0 512 512" aria-hidden="true">
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

        <div className="cta-row">
          <Link href="/sign-in" className="btn">
            Get started
          </Link>
          <Link href="/sign-in" className="btn-ghost">
            I already have an account
          </Link>
        </div>

        <div className="tags">
          <span className="tag">Across East Africa</span>
          <span className="tag">Verified people</span>
          <span className="tag">In-app chat</span>
          <span className="tag">Made in Kenya</span>
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-h2">
          Everything you need to <span className="grad">find your people</span>
        </h2>
        <p className="lp-lead">
          From a spontaneous coffee to your next big night out — Vibely shows
          you who&apos;s around, what&apos;s happening, and who&apos;s worth
          meeting.
        </p>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <span className="lp-ic" style={{ background: f.bg }}>
                {f.icon}
              </span>
              <b>{f.title}</b>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-alt">
        <h2 className="lp-h2">
          Get going in <span className="grad">three steps</span>
        </h2>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cities">
        <span className="lp-cities-label">Live across East Africa</span>
        <div className="lp-city-row">
          {CITIES.map((c) => (
            <span className="lp-city" key={c}>
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-final-panel">
          <h2>Your people are already here.</h2>
          <p>Join Vibely and start meeting them today.</p>
          <div className="cta-row">
            <Link href="/sign-in" className="btn">
              Get started
            </Link>
            <Link href="/sign-in" className="btn-ghost">
              I already have an account
            </Link>
          </div>
        </div>
        <p className="lp-foot">Made in Kenya · for Kenya &amp; East Africa</p>
      </section>
    </main>
  );
}
