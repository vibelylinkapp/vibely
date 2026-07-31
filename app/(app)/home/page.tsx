import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Stories from "@/components/Stories";
import WinbackBanner from "@/components/WinbackBanner";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;

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

  const now = Date.now();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  let winback: {
    state: "expiring" | "lapsed";
    tier: string;
    days: number;
  } | null = null;
  if (sub && sub.tier && sub.tier !== "free" && sub.expires_at) {
    const exp = new Date(sub.expires_at).getTime();
    if (sub.status === "active" && exp > now && exp <= now + 3 * DAY_MS) {
      winback = {
        state: "expiring",
        tier: sub.tier,
        days: Math.ceil((exp - now) / DAY_MS),
      };
    } else if (exp < now && exp >= now - 30 * DAY_MS) {
      winback = {
        state: "lapsed",
        tier: sub.tier,
        days: Math.ceil((now - exp) / DAY_MS),
      };
    }
  }

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
    if (!authorMap[s.profile_id]) return;
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

  // ---- Feed: recent posts (blocked authors filtered out) ----
  const { data: postRows } = await supabase
    .from("posts")
    .select("id, author_id, media_url, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const posts = (postRows ?? []).filter((p) => !blocked.has(p.author_id));

  const postAuthorMap: Record<string, Author> = { ...authorMap };
  const missingAuthorIds = Array.from(
    new Set(posts.map((p) => p.author_id))
  ).filter((id) => !postAuthorMap[id]);
  if (missingAuthorIds.length) {
    const { data: pa } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", missingAuthorIds);
    (pa ?? []).forEach((a) => {
      postAuthorMap[a.id] = a;
    });
  }

  const postIds = posts.map((p) => p.id);
  const likeCount: Record<string, number> = {};
  const myLiked = new Set<string>();
  if (postIds.length) {
    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("post_id, profile_id")
      .in("post_id", postIds);
    (likeRows ?? []).forEach((r) => {
      likeCount[r.post_id] = (likeCount[r.post_id] ?? 0) + 1;
      if (r.profile_id === user.id) myLiked.add(r.post_id);
    });
  }

  return (
    <main className="home-wrap">
      <div className="glow" />

      <header className="appbar">
        <div className="appbar-brand">
          <span className="wordmark">Vibely</span>
        </div>
        <Link
          href="/liked-you"
          className="appbar-btn likes"
          aria-label="See who likes you"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
          </svg>
        </Link>
      </header>

      <section className="home-stories">
        <Stories
          currentUserId={user.id}
          myName={profile.display_name}
          myAvatar={profile.avatar_url}
          groups={groups}
        />
      </section>

      {winback && (
        <WinbackBanner
          state={winback.state}
          tier={winback.tier}
          days={winback.days}
        />
      )}

      {posts.length > 0 ? (
        <section className="feed-list">
          {posts.map((p) => {
            const a = postAuthorMap[p.author_id];
            if (!a) return null;
            return (
              <PostCard
                key={p.id}
                postId={p.id}
                author={a}
                mediaUrl={p.media_url}
                caption={p.caption}
                createdAt={p.created_at}
                likeCount={likeCount[p.id] ?? 0}
                liked={myLiked.has(p.id)}
              />
            );
          })}
        </section>
      ) : (
        <div className="feed-empty">
          <p className="feed-empty-t">Your feed is quiet for now</p>
          <p className="sub">
            Share the first moment, or discover people and follow their
            stories.
          </p>
          <div
            className="cta-row"
            style={{ maxWidth: 320, margin: "16px auto 0" }}
          >
            <Link href="/create" className="btn">
              Share a post
            </Link>
            <Link href="/discover" className="btn-ghost">
              Discover people
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
