import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Stories from "@/components/Stories";

export const dynamic = "force-dynamic";

type Author = { id: string; display_name: string; avatar_url: string | null };
type Story = {
  id: string;
  media_url: string;
  caption: string | null;
  created_at: string;
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, county, avatar_url, onboarding_done")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  const { data: intents } = await supabase
    .from("profile_intents")
    .select("intent")
    .eq("profile_id", user.id);

  // Active (non-expired) stories, grouped by author.
  const nowISO = new Date().toISOString();
  const [{ data: storyRows }, { data: myBlocks }] = await Promise.all([
    supabase
      .from("stories")
      .select("id, profile_id, media_url, caption, created_at")
      .gt("expires_at", nowISO)
      .order("created_at", { ascending: true }),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
  ]);
  const blocked = new Set((myBlocks ?? []).map((b) => b.blocked_id));
  const authorIds = Array.from(
    new Set((storyRows ?? []).map((s) => s.profile_id))
  ).filter((id) => !blocked.has(id));

  const authorMap: Record<string, Author> = {};
  if (authorIds.length) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    (authors ?? []).forEach((a) => {
      authorMap[a.id] = a;
    });
  }

  const grouped: Record<string, Story[]> = {};
  (storyRows ?? []).forEach((s) => {
    if (!authorMap[s.profile_id]) return; // blocked or hidden author
    (grouped[s.profile_id] ??= []).push({
      id: s.id,
      media_url: s.media_url,
      caption: s.caption,
      created_at: s.created_at,
    });
  });
  const groups = Object.entries(grouped)
    .map(([aid, stories]) => ({ author: authorMap[aid], stories }))
    .sort((a, b) =>
      a.author.id === user.id ? -1 : b.author.id === user.id ? 1 : 0
    );

  return (
    <main className="home-wrap">
      <div className="glow" />

      <section className="home-stories">
        <Stories
          currentUserId={user.id}
          myName={profile.display_name}
          myAvatar={profile.avatar_url}
          groups={groups}
        />
      </section>

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
          <Link href="/plans" className="btn-ghost">
            Plans &amp; meetups
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
