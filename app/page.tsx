/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import LandingMobileNav from "@/components/LandingMobileNav";
import SiteFooter from "@/components/SiteFooter";
import { SITE, hasStoreLinks } from "@/lib/site";

const IMG = {
  jane: "/landing/jane.jpg",
  kevin: "/landing/kevin.jpg",
  ashley: "/landing/ashley.jpg",
  mike: "/landing/mike.jpg",
};
const STACK = [IMG.jane, IMG.kevin, IMG.ashley, IMG.mike, IMG.jane];

function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="lp2-logo">
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
      <span className="lp2-word">Vibely</span>
    </span>
  );
}

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
const IcPhone = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);

/**
 * What we promise, rather than invented user counts. Every line here is
 * something the product actually does today.
 */
const ASSURANCES = [
  {
    t: "Verified profiles",
    s: "Accounts confirm they are a real person",
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
    t: "Events",
    s: "What's on near you",
    ic: <IcStar />,
    bg: "linear-gradient(135deg,#FFB020,#FF7A59)",
  },
  {
    t: "People nearby",
    s: "See who's around",
    ic: <IcPin />,
    bg: "linear-gradient(135deg,#F5307E,#7A2FF2)",
  },
  {
    t: "Groups & chat",
    s: "Start a conversation",
    ic: <IcChat />,
    bg: "linear-gradient(135deg,#7A2FF2,#3B82F6)",
  },
  {
    t: "Hangouts",
    s: "Make a plan for today",
    ic: <IcHeart />,
    bg: "linear-gradient(135deg,#FF7A59,#F5307E)",
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
    t: "Events and plans",
    s: "Discover what is happening, or post a plan and see who joins you.",
    ic: <IcCal />,
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
  { n: 1, t: "Sign up", s: "Create your profile. Takes a minute.", ic: <IcPhone /> },
  { n: 2, t: "Explore", s: "See people, events and plans near you.", ic: <IcPin /> },
  { n: 3, t: "Connect", s: "Chat when you both want to.", ic: <IcChat /> },
  { n: 4, t: "Meet up", s: "Turn it into a real plan.", ic: <IcHeart /> },
];

const CITIES = [
  { c: "Nairobi", n: "Where we started", top: "34%", left: "50%", big: true },
  { c: "Mombasa", n: "Growing", top: "16%", left: "82%" },
  { c: "Kampala", n: "Growing", top: "58%", left: "80%" },
  { c: "Kisumu", n: "Growing", top: "74%", left: "40%" },
];

function AvatarStack({ label }: { label: string }) {
  return (
    <div className="lp2-social">
      <div className="lp2-avstack">
        {STACK.map((src, i) => (
          <img key={i} src={src} alt="" className="lp2-av" />
        ))}
      </div>
      <span className="lp2-social-t">{label}</span>
    </div>
  );
}

function Assurances({ variant }: { variant: "mobile" | "desktop" }) {
  const wrap = variant === "mobile" ? "lp2-stats is-assure" : "lp2-dstats";
  const item = variant === "mobile" ? "lp2-stat is-assure" : "lp2-dstat is-assure";
  const iconClass = variant === "mobile" ? "lp2-stat-ic" : "lp2-dstat-ic";

  return (
    <section className={wrap} aria-label="What Vibely promises">
      {ASSURANCES.map((a) => (
        <div className={item} key={a.t}>
          <span className={iconClass}>{a.ic}</span>
          <div>
            <b>{a.t}</b>
            <small>{a.s}</small>
          </div>
        </div>
      ))}
    </section>
  );
}

function StoreLinks() {
  if (!hasStoreLinks) {
    return (
      <p className="lp2-soon">
        <span className="lp2-soon-tag">Coming soon</span>
        Android and iOS apps are on the way. Vibely works in your browser today.
      </p>
    );
  }
  return (
    <div className="lp2-stores">
      {SITE.stores.googlePlay ? (
        <a className="lp2-store" href={SITE.stores.googlePlay}>
          <IcArrow />
          <span>
            <small>Get it on</small>
            <b>Google Play</b>
          </span>
        </a>
      ) : null}
      {SITE.stores.appStore ? (
        <a className="lp2-store" href={SITE.stores.appStore}>
          <IcArrow />
          <span>
            <small>Download on the</small>
            <b>App Store</b>
          </span>
        </a>
      ) : null}
    </div>
  );
}

function FounderNote() {
  return (
    <div className="lp2-note">
      <p>
        We built Vibely in Nairobi because meeting people here still happens
        mostly through friends of friends — and that leaves out anyone who has
        just moved, just graduated, or simply wants a wider circle than the one
        they inherited.
      </p>
      <span className="lp2-note-by">The Vibely team, Nairobi</span>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="lp2">
      {/* ==================== MOBILE ==================== */}
      <div className="lp2-mobile">
        <header className="lp2-mtop">
          <Logo size={30} />
          <div className="lp2-mtop-r">
            <Link href="/sign-in" className="lp2-login">
              Log in
            </Link>
            <LandingMobileNav />
          </div>
        </header>

        <section className="lp2-mhero">
          <span className="lp2-pill">
            <IcHeart /> Made in Kenya, for East Africa
          </span>
          <h1 className="lp2-h1">
            Meet real
            <br />
            people <span className="grad">near you.</span>
          </h1>
          <p className="lp2-lead">
            Dating, friends, hangouts and networking — one app to find your
            people across Kenya and East Africa.
          </p>

          <div className="lp2-cluster">
            <div className="lp2-pc lp2-pc-a">
              <img src={IMG.jane} alt="" />
              <span className="lp2-pc-cap">
                <b>Jane, 22</b>
                <small>300m away</small>
              </span>
            </div>
            <div className="lp2-pc lp2-pc-b">
              <img src={IMG.kevin} alt="" />
              <span className="lp2-pc-cap">
                <b>Kevin, 26</b>
                <small>1.2km away</small>
              </span>
            </div>
            <div className="lp2-pc lp2-pc-c">
              <img src={IMG.ashley} alt="" />
              <span className="lp2-pc-cap">
                <b>Ashley, 23</b>
                <small>Online</small>
              </span>
            </div>
            <span className="lp2-badge lp2-badge-heart">
              <IcHeart />
            </span>
            <span className="lp2-badge lp2-badge-fire" aria-hidden="true">
              <IcStar />
            </span>
          </div>
          <p className="lp2-caption">Illustration of the Vibely app</p>

          <AvatarStack label="Real people, from Nairobi and beyond" />

          <div className="lp2-cta">
            <Link href="/sign-in" className="btn lp2-btn-lg">
              Join Vibely for free <IcArrow />
            </Link>
            <Link href="/sign-in" className="lp2-ghost-dark">
              <IcPin /> See who&apos;s nearby
            </Link>
          </div>

          <Assurances variant="mobile" />
        </section>

        <section className="lp2-msection" id="explore">
          <div className="lp2-row-head">
            <h2>Explore what&apos;s happening</h2>
            <Link href="/sign-in">View all</Link>
          </div>
          <div className="lp2-explore">
            {EXPLORE.map((e) => (
              <div className="lp2-exp" key={e.t}>
                <span className="lp2-exp-ic" style={{ background: e.bg }}>
                  {e.ic}
                </span>
                <b>{e.t}</b>
                <small>{e.s}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="lp2-msection" id="story">
          <FounderNote />
        </section>

        <section className="lp2-mfinal">
          <div className="lp2-final-card">
            <span className="lp2-final-ic">
              <IcHeart />
            </span>
            <div className="lp2-final-tx">
              <b>Your people are closer than you think.</b>
              <small>Join Vibely and start connecting today.</small>
            </div>
            <Link href="/sign-in" className="lp2-final-btn">
              Join free <IcArrow />
            </Link>
          </div>
          <div className="lp2-trust">
            <span>
              <IcShield /> <Link href="/safety">Safety first</Link>
            </span>
            <span>
              <IcLock /> <Link href="/privacy">Your privacy</Link>
            </span>
            <span>
              <IcPin /> Across East Africa
            </span>
          </div>
          <StoreLinks />
        </section>

        <SiteFooter />
      </div>

      {/* ==================== DESKTOP ==================== */}
      <div className="lp2-desktop">
        <header className="lp2-nav">
          <Logo size={34} />
          <nav className="lp2-nav-links">
            <a href="#why">Features</a>
            <a href="#how">How it works</a>
            <Link href="/safety">Safety</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="lp2-nav-r">
            <span className="lp2-country">
              <IcPin /> Kenya
            </span>
            <Link href="/sign-in" className="lp2-login">
              Log in
            </Link>
            <Link href="/sign-in" className="btn lp2-btn-sm">
              Join free
            </Link>
          </div>
        </header>

        <section className="lp2-dhero">
          <div className="lp2-dhero-l">
            <span className="lp2-pill">
              <IcHeart /> Made in Kenya, for East Africa
            </span>
            <h1 className="lp2-dh1">
              Your next connection is{" "}
              <span className="grad">closer than you think.</span>
            </h1>
            <p className="lp2-lead">
              Meet real people, make friends, find dates, and discover events
              around you.
            </p>
            <AvatarStack label="Real people, from Nairobi and beyond" />
            <div className="lp2-dcta">
              <Link href="/sign-in" className="btn lp2-btn-lg">
                Join free <IcArrow />
              </Link>
              <Link href="/sign-in" className="lp2-ghost-dark">
                <IcPin /> See who&apos;s nearby
              </Link>
            </div>
            <StoreLinks />
          </div>

          <div className="lp2-dhero-c">
            <div className="lp2-phone">
              <div className="lp2-phone-notch" />
              <div className="lp2-phone-top">
                <span className="lp2-word lp2-word-sm">Vibely</span>
                <span className="lp2-phone-loc">
                  <IcPin /> Nairobi
                </span>
              </div>
              <div className="lp2-phone-mini">
                {[
                  { src: IMG.jane, n: "Sarah, 24", d: "300m away" },
                  { src: IMG.kevin, n: "Kevin, 26", d: "1.2km away" },
                ].map((m) => (
                  <div className="lp2-mini" key={m.n}>
                    <img src={m.src} alt="" />
                    <span className="lp2-mini-cap">
                      <b>{m.n}</b>
                      <small>
                        <IcPin /> {m.d}
                      </small>
                    </span>
                    <span className="lp2-mini-heart">
                      <IcHeart />
                    </span>
                  </div>
                ))}
              </div>
              <div className="lp2-phone-event">
                <span className="lp2-ev-ic">
                  <IcStar />
                </span>
                <span className="lp2-ev-tx">
                  <b>Sunset Rooftop Vibes</b>
                  <small>Today, 6:00 PM · Nairobi</small>
                </span>
                <span className="lp2-ev-go">Join</span>
              </div>
            </div>
            <p className="lp2-caption">Illustration of the Vibely app</p>

            <div className="lp2-float lp2-float-1">
              <img src={IMG.mike} alt="" />
              <span className="lp2-float-cap">
                <b>Mike, 27</b>
                <small>1.1km away</small>
              </span>
            </div>
            <div className="lp2-float lp2-float-2">
              <img src={IMG.ashley} alt="" />
              <span className="lp2-float-cap">
                <b>Ashley, 23</b>
                <small>Online</small>
              </span>
            </div>
          </div>

          <div className="lp2-dhero-r">
            <div className="lp2-map">
              <span className="lp2-map-glow" />
              <svg
                className="lp2-map-net"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="lp2net" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F5307E" />
                    <stop offset="1" stopColor="#7A2FF2" />
                  </linearGradient>
                </defs>
                <g className="lp2-net-lines">
                  <line x1="50" y1="34" x2="82" y2="16" />
                  <line x1="50" y1="34" x2="80" y2="58" />
                  <line x1="50" y1="34" x2="40" y2="74" />
                  <line x1="40" y1="74" x2="80" y2="58" />
                </g>
                <g className="lp2-net-flow">
                  <line x1="50" y1="34" x2="82" y2="16" pathLength={100} />
                  <line x1="50" y1="34" x2="80" y2="58" pathLength={100} />
                  <line x1="50" y1="34" x2="40" y2="74" pathLength={100} />
                  <line x1="40" y1="74" x2="80" y2="58" pathLength={100} />
                </g>
              </svg>
              {CITIES.map((c) => (
                <span
                  key={c.c}
                  className={"lp2-city" + (c.big ? " big" : "")}
                  style={{ top: c.top, left: c.left }}
                >
                  <span className="lp2-city-pin" />
                  <span className="lp2-city-tx">
                    <b>{c.c}</b>
                    <small>{c.n}</small>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <Assurances variant="desktop" />

        <section className="lp2-light" id="why">
          <div className="lp2-two">
            <div>
              <h2 className="lp2-h2">
                Why you&apos;ll love <span className="grad">Vibely</span>
              </h2>
              <div className="lp2-feats">
                {FEATURES.map((f) => (
                  <div className="lp2-feat" key={f.t}>
                    <span className="lp2-feat-ic" style={{ background: f.bg }}>
                      {f.ic}
                    </span>
                    <b>{f.t}</b>
                    <small>{f.s}</small>
                  </div>
                ))}
              </div>
            </div>
            <div id="how">
              <h2 className="lp2-h2">
                How <span className="grad">Vibely</span> works
              </h2>
              <div className="lp2-steps">
                {STEPS.map((st) => (
                  <div className="lp2-step" key={st.n}>
                    <span className="lp2-step-ic">
                      {st.ic}
                      <span className="lp2-step-n">{st.n}</span>
                    </span>
                    <b>{st.t}</b>
                    <small>{st.s}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lp2-dnote" id="story">
            <FounderNote />
          </div>

          <div className="lp2-dfinal" id="safe">
            <span className="lp2-final-ic">
              <IcShield />
            </span>
            <div className="lp2-dfinal-tx">
              <b>
                Safe. Respectful. <span className="grad">Real.</span>
              </b>
              <small>
                Verification, moderation and privacy controls are part of the
                product, not an afterthought. Read our{" "}
                <Link href="/safety">safety guidance</Link> before you meet
                anyone.
              </small>
            </div>
            <div className="lp2-dfinal-cta">
              <div className="lp2-avstack">
                {STACK.map((src, i) => (
                  <img key={i} src={src} alt="" className="lp2-av" />
                ))}
              </div>
              <Link href="/sign-in" className="btn lp2-btn-lg">
                Join Vibely for free <IcArrow />
              </Link>
            </div>
          </div>

          <SiteFooter tone="light" />
        </section>
      </div>
    </main>
  );
}
