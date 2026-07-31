import Link from "next/link";

type Feat = {
  title: string;
  text: string;
  bg: string;
  icon: React.ReactNode;
};

const FEATS: Feat[] = [
  {
    title: "People nearby",
    text: "Verified people around you",
    bg: "linear-gradient(135deg,#7A2FF2,#F5307E)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Live heatmap",
    text: "See where the vibe is",
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
    title: "Events",
    text: "Book what's happening",
    bg: "linear-gradient(135deg,#FF7A59,#FFB020)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9 5.5-.8z" />
      </svg>
    ),
  },
  {
    title: "Plans & chat",
    text: "Meet up, then talk",
    bg: "linear-gradient(135deg,#F5307E,#7A2FF2)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <main className="lp">
      <div className="glow" />

      <section className="hero">
        <div className="logo">
          <svg width="56" height="56" viewBox="0 0 512 512" aria-hidden="true">
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
          Dating, friends, hangouts and networking — one app to find your
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

      <section className="lp-feats" aria-label="What's inside">
        {FEATS.map((f) => (
          <div className="lp-feat" key={f.title}>
            <span className="lp-feat-ic" style={{ background: f.bg }}>
              {f.icon}
            </span>
            <span className="lp-feat-tx">
              <b>{f.title}</b>
              <small>{f.text}</small>
            </span>
          </div>
        ))}
      </section>

      <p className="lp-foot">Made in Kenya · for Kenya &amp; East Africa</p>
    </main>
  );
}
