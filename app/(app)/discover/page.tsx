import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import BottomNav from "@/components/BottomNav";
import HomeSearch from "@/components/HomeSearch";
import EventCard, { type EventCardData } from "@/components/EventCard";
import type { Database } from "@/lib/database.types";

type Intent = Database["public"]["Enums"]["intent_t"];

const FILTERS: { id: Intent | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "dating", label: "Dating" },
  { id: "friendship", label: "Friends" },
  { id: "hangout", label: "Hangout" },
  { id: "networking", label: "Networking" },
  { id: "gym", label: "Gym" },
  { id: "coffee", label: "Coffee" },
  { id: "travel", label: "Travel" },
];

const NO_MATCH = "00000000-0000-0000-0000-000000000000";

function fmtDay(iso: string | null): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function eventPlace(
  area: string | null,
  city: string | null,
  country: string | null
): string {
  const base = [area, city].filter(Boolean).join(", ") || city || "";
  return country && country !== "Kenya"
    ? `${base}${base ? ", " : ""}${country}`
    : base;
}

type EventRow = {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  venue: string | null;
  area: string | null;
  city: string;
  country: string;
  price_kes: number;
  starts_at: string | null;
  going_base: number;
  is_trending: boolean;
};

function toCard(e: EventRow): EventCardData {
  return {
    id: e.id,
    title: e.title,
    image_url: e.image_url,
    category: e.category,
    venue: e.venue,
    area: e.area,
    city: e.city,
    country: e.country,
    price_kes: e.price_kes ?? 0,
    starts_at: e.starts_at,
    going: e.going_base ?? 0,
  };
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const active = sp.intent ?? "all";
  const q = (sp.q ?? "").trim();
  const isDefault = !q && active === "all";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const nowIso = new Date().toISOString();

  const [
    { data: blockedRows },
    { data: likedRows },
    { data: boostRows },
    { data: meProfile },
    { data: eventRows },
  ] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("likes").select("liked_id").eq("liker_id", user.id),
    supabase.from("boosts").select("profile_id").gt("expires_at", nowIso),
    supabase
      .from("profiles")
      .select("area, county")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select(
        "id, title, image_url, category, venue, area, city, country, price_kes, starts_at, going_base, is_trending"
      )
      .eq("status", "published")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(24),
  ]);
  const excludeIds = new Set<string>([
    ...(blockedRows ?? []).map((b) => b.blocked_id),
    ...(likedRows ?? []).map((l) => l.liked_id),
  ]);
  const boostedSet = new Set<string>((boostRows ?? []).map((b) => b.profile_id));
  boostedSet.delete(user.id);

  let matchSet: Set<string> | null = null;
  if (active !== "all") {
    const { data: pi } = await supabase
      .from("profile_intents")
      .select("profile_id")
      .eq("intent", active as Intent);
    matchSet = new Set((pi ?? []).map((r) => r.profile_id));
  }

  // Boosted profiles that pass the current filter — pinned to the top.
  const boostedCandidateIds = [...boostedSet].filter(
    (id) => !excludeIds.has(id) && (!matchSet || matchSet.has(id))
  );
  const { data: boostedData } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified, show_verification"
    )
    .in("id", boostedCandidateIds.length ? boostedCandidateIds : [NO_MATCH])
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false);
  // A text search (from Home) filters by name and skips boosted pinning.
  const boostedProfiles = q ? [] : (boostedData ?? []);

  // Normal feed, most-recently-active first.
  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified, show_verification"
    )
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false)
    .neq("id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(80);
  if (matchSet) {
    query = query.in("id", matchSet.size ? [...matchSet] : [NO_MATCH]);
  }
  if (q) {
    query = query.ilike("display_name", `%${q}%`);
  }
  const { data: feedData } = await query;
  const feedProfiles = (feedData ?? []).filter((p) => !excludeIds.has(p.id));

  const boostedIdSet = new Set(boostedProfiles.map((p) => p.id));
  const profiles = [
    ...boostedProfiles,
    ...feedProfiles.filter((p) => !boostedIdSet.has(p.id)),
  ].slice(0, 60);

  const ids = profiles.map((p) => p.id);
  const intentMap: Record<string, string[]> = {};
  if (ids.length) {
    const { data: allIntents } = await supabase
      .from("profile_intents")
      .select("profile_id, intent")
      .in("profile_id", ids);
    (allIntents ?? []).forEach((r) => {
      (intentMap[r.profile_id] ??= []).push(r.intent);
    });
  }

  // VIP members get a badge on their card.
  const vipSet = new Set<string>();
  if (ids.length) {
    const { data: vipRows } = await supabase
      .from("subscriptions")
      .select("profile_id")
      .in("profile_id", ids)
      .eq("tier", "vip")
      .eq("status", "active")
      .gt("expires_at", nowIso);
    (vipRows ?? []).forEach((r) => vipSet.add(r.profile_id));
  }

  // People the viewer already follows (own rows only, allowed under counts-only RLS).
  const followingSet = new Set<string>();
  if (ids.length) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", ids);
    (followRows ?? []).forEach((r) => followingSet.add(r.following_id));
  }

  const events = (eventRows ?? []) as EventRow[];
  const featured = isDefault ? events.slice(0, 6) : [];
  const trending = isDefault
    ? [...events]
        .filter((e) => e.is_trending)
        .sort((a, b) => (b.going_base ?? 0) - (a.going_base ?? 0))
        .slice(0, 8)
    : [];
  const locationLabel =
    [meProfile?.area, meProfile?.county].filter(Boolean).join(", ") ||
    "East Africa";

  const peopleHeading = isDefault
    ? "People to connect with"
    : q
      ? `Results for \u201c${q}\u201d`
      : "People";

  return (
    <main className="feed-wrap disc2">
      <div className="disc2-head">
        <div className="disc2-head-l">
          <span className="disc2-title">Discover</span>
          <span className="disc2-loc">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {locationLabel}
          </span>
        </div>
        <div className="disc2-head-r">
          <Link
            href="/nearby"
            className="disc2-ico"
            aria-label="People nearby"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </Link>
          <Link
            href="/liked-you"
            className="disc2-ico"
            aria-label="See who likes you"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="disc2-search">
        <HomeSearch />
      </div>

      <div className="disc2-chips">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/discover" : `/discover?intent=${f.id}`}
            className={"chip" + (active === f.id ? " chip-on" : "")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {isDefault && featured.length > 0 && (
        <section className="disc2-sec">
          <div className="disc2-sec-head">
            <h2>Featured around you</h2>
            <Link href="/events" className="disc2-seeall">
              See all
            </Link>
          </div>
          <div className="disc2-rail disc2-rail-feat">
            {featured.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="disc2-feat"
              >
                <div
                  className="disc2-feat-ph"
                  style={
                    e.image_url
                      ? { backgroundImage: `url('${e.image_url}')` }
                      : undefined
                  }
                >
                  {e.category && (
                    <span className="disc2-feat-badge">{e.category}</span>
                  )}
                  <span className="disc2-feat-going">
                    {e.going_base ?? 0} going
                  </span>
                  <div className="disc2-feat-grad" />
                  <div className="disc2-feat-body">
                    <b className="disc2-feat-title">{e.title}</b>
                    <span className="disc2-feat-sub">
                      {eventPlace(e.area, e.city, e.country)} &middot;{" "}
                      {fmtDay(e.starts_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isDefault && trending.length > 0 && (
        <section className="disc2-sec">
          <div className="disc2-sec-head">
            <h2>Trending Events</h2>
            <Link href="/events" className="disc2-seeall">
              See all
            </Link>
          </div>
          <div className="disc2-rail">
            {trending.map((e) => (
              <EventCard key={e.id} e={toCard(e)} variant="rail" />
            ))}
          </div>
        </section>
      )}

      <section className="disc2-sec">
        <div className="disc2-sec-head">
          <h2>{peopleHeading}</h2>
          {isDefault && (
            <Link href="/nearby" className="disc2-seeall">
              See all
            </Link>
          )}
        </div>

        {profiles.length === 0 ? (
          <p className="sub" style={{ textAlign: "center", marginTop: 24 }}>
            {q
              ? `No people match \u201c${q}\u201d. Try a different name, or clear your search.`
              : "You\u2019re all caught up. As more people join Vibely \u2014 or once you clear your current likes \u2014 new faces will show up here. Invite a friend to sign up and watch this fill in."}
          </p>
        ) : (
          <div className="grid">
            {profiles.map((p) => {
              const card = {
                ...p,
                is_verified: p.is_verified && p.show_verification,
              };
              return (
                <ProfileCard
                  key={p.id}
                  p={card}
                  intents={intentMap[p.id] ?? []}
                  boosted={boostedIdSet.has(p.id)}
                  vip={vipSet.has(p.id)}
                  showFollow
                  following={followingSet.has(p.id)}
                />
              );
            })}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
