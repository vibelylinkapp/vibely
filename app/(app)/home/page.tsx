import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, county, onboarding_done")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  const { data: intents } = await supabase
    .from("profile_intents")
    .select("intent")
    .eq("profile_id", user.id);

  return (
    <main className="wrap app-page">
      <div className="glow" />
      <section className="hero">
        <div className="logo">
          <svg width="48" height="48" viewBox="0 0 512 512" aria-hidden="true">
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

        <h1 className="headline">Karibu, {profile.display_name}.</h1>
        <p className="sub">
          Your profile is live in {profile.county ?? "Kenya"}. Start meeting
          your people.
        </p>

        {intents && intents.length > 0 && (
          <div className="tags">
            {intents.map((i) => (
              <span className="tag" key={i.intent}>
                {i.intent}
              </span>
            ))}
          </div>
        )}

        <div className="cta-row">
          <Link href="/discover" className="btn">
            Discover people nearby
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
