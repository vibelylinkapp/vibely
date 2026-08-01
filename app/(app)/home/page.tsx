import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Stories from "@/components/Stories";
import WinbackBanner from "@/components/WinbackBanner";
import PostCard from "@/components/PostCard";
import EventCard, { EventCardData } from "@/components/EventCard";
import NotifBell from "@/components/NotifBell";
import LikeButton from "@/components/LikeButton";
import HomeSearch from "@/components/HomeSearch";
import FeedLoadMore from "@/components/FeedLoadMore";
import { getFeedPage, FEED_PAGE_SIZE } from "@/lib/feed";
import AdminNotice from "@/components/AdminNotice";
import VerifyNudge from "@/components/VerifyNudge";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;

type Author = { id: string; display_name: string; avatar_url: string | null };
type Story = {
  id: string;
  media_url: string;
  caption: string | null;
  created_at: string;
};

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, county, avatar_url, onboarding_done, verification")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  const now = Date.now();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Live "online now" count for the greeting card.
  const { count: onlineCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_online", true)
    .neq("id", user.id);

  // Latest active admin notice -> dismissible banner at the top of Home.
  const { data: notice } = await supabase
    .from("announcements")
    .select("id, body, link")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Nudge unverified members to get the badge (unless a review is pending).
  const verified =
    profile.verification === "selfie" ||
    profile.verification === "national_id" ||
    profile.verification === "passport";
  let showVerifyNudge = false;
  if (!verified) {
    const { data: vReq } = await supabase
      .from("verification_requests")
      .select("status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    showVerifyNudge = vReq?.status !== "pending";
  }

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

  // ---- People near you rail (welcoming faces right under the stories) ----
  const { data: nearbyRows } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, area, county, is_online, birthdate, is_verified"
    )
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false)
    .neq("id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(18);
  const nearbyPeople = (nearbyRows ?? [])
    .filter((p) => !blocked.has(p.id))
    .slice(0, 14);

  // Interest tags + my existing likes for the People-near-you cards.
  const nearIds = nearbyPeople.map((p) => p.id);
  const nearIntents: Record<string, string[]> = {};
  const myLikes = new Set<string>();
  if (nearIds.length) {
    const [{ data: ints }, { data: likeRows }] = await Promise.all([
      supabase
        .from("profile_intents")
        .select("profile_id, intent")
        .in("profile_id", nearIds),
      supabase
        .from("likes")
        .select("liked_id")
        .eq("liker_id", user.id)
        .in("liked_id", nearIds),
    ]);
    (ints ?? []).forEach((r) => {
      (nearIntents[r.profile_id] ??= []).push(r.intent);
    });
    (likeRows ?? []).forEach((r) => myLikes.add(r.liked_id));
  }

  // ---- Feed: first page (blocked authors + hidden posts filtered out) ----
  const { items: feedItems, nextCursor: feedNextCursor } = await getFeedPage(
    supabase,
    user.id,
    { limit: FEED_PAGE_SIZE }
  );

  // Author cache for the check-ins rail (seeded from story authors).
  const postAuthorMap: Record<string, Author> = { ...authorMap };

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

  const nairobiHour = (new Date().getUTCHours() + 3) % 24;
  const greeting =
    nairobiHour < 12
      ? "Good morning"
      : nairobiHour < 17
        ? "Good afternoon"
        : "Good evening";
  const firstName = profile.display_name.split(" ")[0];
  const stackAvatars = nearbyPeople
    .filter((p) => p.avatar_url)
    .slice(0, 4)
    .map((p) => p.avatar_url as string);

  return (
    <main className="home-wrap">
      <div className="glow" />

      <header className="appbar">
        <div className="appbar-brand">
          <svg width="30" height="30" viewBox="0 0 512 512" aria-hidden="true">
            <defs>
              <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF7A59" />
                <stop offset="0.45" stopColor="#F5307E" />
                <stop offset="1" stopColor="#7A2FF2" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="120" fill="url(#hbg)" />
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
        <div className="appbar-actions">
          <Link href="/nearby" className="appbar-loc">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {profile.county || "Kenya"}
            <svg className="appbar-loc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Link>
          <NotifBell />
          <Link
            href="/matches"
            className="appbar-btn matches"
            aria-label="Your matches"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8.5 4A3.5 3.5 0 0 0 5 7.5C5 10.5 10 13.5 10 13.5s5-3 5-6A3.5 3.5 0 0 0 8.5 4z" opacity="0.55" />
              <path d="M15 8a3.5 3.5 0 0 0-3.5 3.5c0 3 5 6 5 6s5-3 5-6A3.5 3.5 0 0 0 15 8z" />
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

      {notice && (
        <AdminNotice id={notice.id} body={notice.body} link={notice.link} />
      )}

      {showVerifyNudge && <VerifyNudge />}

      <section className="home-hi">
        <Link href="/profile" className="home-hi-av">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.display_name} />
          ) : (
            <span className="home-hi-initial">
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="home-hi-dot" />
        </Link>
        <div className="home-hi-tx">
          <span className="home-hi-greet">
            {greeting}, {firstName}
          </span>
          <h1 className="home-hi-h">
            People, vibes and moments <span className="grad">near you.</span>
          </h1>
        </div>
        <Link href="/nearby" className="home-hi-stat" aria-label="See who is online">
          <span className="home-hi-stat-top">
            <svg className="home-hi-fire" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2c1 3-1 4.5-2 6-1.2 1.8-1 3.4 0 4.4.8-.4 1.3-1.2 1.5-2.2 1.6 1.2 2.5 2.7 2.5 4.3A4.5 4.5 0 0 1 9.5 19 5 5 0 0 1 7 10c.8.6 1.6.8 2.3.6C8 8.7 9.3 5 12 2z" />
            </svg>
            <b>{(onlineCount ?? 0).toLocaleString()}</b>
          </span>
          <small>
            <span className="home-hi-live" /> online now
          </small>
          {stackAvatars.length > 0 && (
            <span className="home-hi-avs">
              {stackAvatars.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" />
              ))}
            </span>
          )}
        </Link>
      </section>

      <HomeSearch />

      <section className="home-stories">
        <Stories
          currentUserId={user.id}
          myName={profile.display_name}
          myAvatar={profile.avatar_url}
          groups={groups}
        />
      </section>

      {nearbyPeople.length > 0 && (
        <section className="home-pnear">
          <div className="sec">
            <h3>People near you</h3>
            <Link href="/nearby">See all</Link>
          </div>
          <div className="pnear-grid">
            {nearbyPeople.map((p, idx) => {
              const age = p.birthdate ? ageFrom(p.birthdate) : null;
              const tags = nearIntents[p.id] ?? [];
              return (
                <div key={p.id} className="pnear-card">
                  <Link href={`/u/${p.id}`} className="pnear-photo">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt={p.display_name} />
                    ) : (
                      <span className="pnear-initial">
                        {p.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="pnear-scrim" />
                    {p.is_online && <span className="pnear-dot" />}
                    {idx === 0 && (
                      <span className="pnear-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.1l5.9-.8z" />
                        </svg>
                        Popular
                      </span>
                    )}
                    <span className="pnear-ov">
                      <b>
                        {p.display_name.split(" ")[0]}
                        {age ? `, ${age}` : ""}
                        {p.is_verified && (
                          <svg className="pnear-ver" viewBox="0 0 24 24" aria-label="Verified">
                            <circle cx="12" cy="12" r="12" fill="#7A2FF2" />
                            <path d="M7 12.5l3 3 7-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </b>
                      {(p.area || p.county) && (
                        <small>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          {p.area || p.county}
                        </small>
                      )}
                      {tags.length > 0 && (
                        <span className="pnear-ovtags">
                          {tags.slice(0, 2).map((t) => (
                            <span className="pnear-ovtag" key={t}>
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </Link>
                  <div className="pnear-like">
                    <LikeButton
                      targetId={p.id}
                      targetName={p.display_name}
                      initialLiked={myLikes.has(p.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

      <Link href="/discover" className="home-share">
        <span className="home-share-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-3.6-3.6" />
            <path d="M11 8.2v5.6M8.2 11h5.6" />
          </svg>
        </span>
        <span className="home-share-tx">
          <b>Discover people near you</b>
          <small>Browse profiles and find your next connection</small>
        </span>
        <span className="home-share-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          Start discovering
        </span>
      </Link>

      {winback && (
        <WinbackBanner
          state={winback.state}
          tier={winback.tier}
          days={winback.days}
        />
      )}

      {feedItems.length > 0 ? (
        <section className="feed-list">
          {feedItems.map((it) => (
            <PostCard
              key={it.postId}
              postId={it.postId}
              author={it.author}
              mediaUrl={it.mediaUrl}
              caption={it.caption}
              createdAt={it.createdAt}
              likeCount={it.likeCount}
              liked={it.liked}
              commentCount={it.commentCount}
              canDelete={it.canDelete}
              canReport={it.canReport}
            />
          ))}
          <FeedLoadMore
            initialCursor={feedNextCursor}
            seenIds={feedItems.map((it) => it.postId)}
          />
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
