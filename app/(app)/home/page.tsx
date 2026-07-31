import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Stories from "@/components/Stories";
import WinbackBanner from "@/components/WinbackBanner";
import PostCard from "@/components/PostCard";
import EventCard, { EventCardData } from "@/components/EventCard";

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
  const [{ data: storyRows }, { data: myBlocks }, { data: myHides }] =
    await Promise.all([
      supabase
        .from("stories")
        .select("id, profile_id, media_url, caption, created_at")
        .gt("expires_at", nowISO)
        .order("created_at", { ascending: true }),
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      supabase.from("post_hides").select("post_id").eq("profile_id", user.id),
    ]);
  const blocked = new Set((myBlocks ?? []).map((b) => b.blocked_id));
  const hidden = new Set((myHides ?? []).map((h) => h.post_id));
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

  // ---- Feed: recent posts (blocked authors and hidden posts filtered out) ----
  const { data: postRows } = await supabase
    .from("posts")
    .select("id, author_id, media_url, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const posts = (postRows ?? []).filter(
    (p) => !blocked.has(p.author_id) && !hidden.has(p.id)
  );

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

  const commentCount: Record<string, number> = {};
  if (postIds.length) {
    const { data: commentRows } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);
    (commentRows ?? []).forEach((r) => {
      commentCount[r.post_id] = (commentCount[r.post_id] ?? 0) + 1;
    });
  }

  // ---- Trending events rail ----
  const trendNow = new Date().toISOString();
  const { data: trendRows } = await supabase
    .from("events")
    .select(
      "id, title, image_url, category, venue, area, city, country, price_kes, starts_at, going_base"
    )
    .eq("status", "published")
    .eq("is_trending", true)
    .gte("starts_at", trendNow)
    .order("starts_at", { ascending: true })
    .limit(8);
  const trendList = trendRows ?? [];
  const trendGoing: Record<string, number> = {};
  if (trendList.length) {
    const { data: eb } = await supabase
      .from("event_bookings")
      .select("event_id")
      .in(
        "event_id",
        trendList.map((e) => e.id)
      );
    (eb ?? []).forEach((b) => {
      trendGoing[b.event_id] = (trendGoing[b.event_id] ?? 0) + 1;
    });
  }
  const trending: EventCardData[] = trendList.map((e) => ({
    id: e.id,
    title: e.title,
    image_url: e.image_url,
    category: e.category,
    venue: e.venue,
    area: e.area,
    city: e.city,
    country: e.country,
    price_kes: e.price_kes,
    starts_at: e.starts_at,
    going: (trendGoing[e.id] ?? 0) + e.going_base,
  }));

  // ---- Out right now (active check-ins) ----
  const { data: ciRows } = await supabase
    .from("checkins")
    .select("id, profile_id, place, area, note, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(15);
  const ciFiltered = (ciRows ?? []).filter((c) => !blocked.has(c.profile_id));
  const ciMissing = Array.from(
    new Set(ciFiltered.map((c) => c.profile_id))
  ).filter((id) => !postAuthorMap[id]);
  if (ciMissing.length) {
    const { data: ca } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ciMissing);
    (ca ?? []).forEach((a) => {
      postAuthorMap[a.id] = a;
    });
  }
  const checkins = ciFiltered
    .map((c) => ({
      id: c.id,
      author: postAuthorMap[c.profile_id],
      place: c.place,
      area: c.area,
      note: c.note,
    }))
    .filter(
      (
        c
      ): c is {
        id: string;
        author: Author;
        place: string;
        area: string | null;
        note: string | null;
      } => Boolean(c.author)
    );

  return (
    <main className="home-wrap">
      <div className="glow" />

      <header className="appbar">
        <div className="appbar-brand">
          <span className="wordmark">Vibely</span>
        </div>
        <div className="appbar-actions">
          <Link
            href="/nearby"
            className="appbar-btn nearby"
            aria-label="People nearby"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </Link>
          <Link
            href="/liked-you"
            className="appbar-btn likes"
            aria-label="See who likes you"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
            </svg>
          </Link>
        </div>
      </header>

      <section className="home-stories">
        <Stories
          currentUserId={user.id}
          myName={profile.display_name}
          myAvatar={profile.avatar_url}
          groups={groups}
        />
      </section>

      {checkins.length > 0 && (
        <section className="home-checkins">
          <div className="sec">
            <h3>Out right now</h3>
          </div>
          <div className="hscroll">
            {checkins.map((c) => (
              <Link key={c.id} href={`/u/${c.author.id}`} className="ci-chip">
                <span className="ci-av">
                  {c.author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar_url} alt={c.author.display_name} />
                  ) : (
                    c.author.display_name.charAt(0).toUpperCase()
                  )}
                  <span className="ci-live-dot" />
                </span>
                <span className="ci-nm">
                  {c.author.display_name.split(" ")[0]}
                </span>
                <span className="ci-place">
                  {c.place}
                  {c.area ? ` \u00b7 ${c.area}` : ""}
                </span>
                {c.note && <span className="ci-note">{c.note}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="home-trending">
          <div className="sec">
            <h3>Trending near you</h3>
            <Link href="/events">See all</Link>
          </div>
          <div className="hscroll">
            {trending.map((e) => (
              <EventCard key={e.id} e={e} variant="rail" />
            ))}
          </div>
        </section>
      )}

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
                commentCount={commentCount[p.id] ?? 0}
                canDelete={p.author_id === user.id}
                canReport={p.author_id !== user.id}
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
