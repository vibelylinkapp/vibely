import { redirect } from "next/navigation";
import { escapeLike } from "@/lib/security/sanitize";
import { DISCOVER_INTERESTS, cleanInterests, isInterest } from "@/lib/interests";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import WhatsAppAskButton from "@/components/WhatsAppAskButton";
import HomeSearch from "@/components/HomeSearch";
import EventCard, { type EventCardData } from "@/components/EventCard";
import type { Database } from "@/lib/database.types";
import type { CSSProperties, ReactNode } from "react";

type Intent = Database["public"]["Enums"]["intent_t"];

const FILTERS: {
  id: Intent | "all";
  label: string;
  bg: string;
  fg: string;
  icon: ReactNode;
}[] = [
  {
    id: "all",
    label: "All",
    bg: "#efeafb",
    fg: "#7a2ff2",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" />
        <rect x="14" y="14" width="7" height="7" rx="1.6" />
      </svg>
    ),
  },
  {
    id: "dating",
    label: "Dating",
    bg: "#ffe4ee",
    fg: "#e93d82",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
      </svg>
    ),
  },
  {
    id: "friendship",
    label: "Friends",
    bg: "#ece9fd",
    fg: "#6d5cf0",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8.5" cy="8" r="3" />
        <path d="M2.5 20c0-3.3 2.7-5.5 6-5.5" />
        <circle cx="16.5" cy="9.5" r="2.5" />
        <path d="M14 20c0-2.6 1.9-4.5 4.5-4.5" />
      </svg>
    ),
  },
  {
    id: "hangout",
    label: "Hangout",
    bg: "#fdefe0",
    fg: "#f0932f",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
      </svg>
    ),
  },
  {
    id: "networking",
    label: "Networking",
    bg: "#e7eefe",
    fg: "#3b6fe0",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    id: "gym",
    label: "Gym",
    bg: "#eafbe7",
    fg: "#35a92f",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9v6M7 7.5v9M17 7.5v9M20 9v6M7 12h10" />
      </svg>
    ),
  },
  {
    id: "coffee",
    label: "Coffee",
    bg: "#f6ece1",
    fg: "#b4722e",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 8h13v4.5a4.5 4.5 0 0 1-4.5 4.5h-4A4.5 4.5 0 0 1 4 12.5z" />
        <path d="M17 9h1.8a2.2 2.2 0 0 1 0 4.4H17" />
        <path d="M7.5 3.2v1.8M11 3.2v1.8" />
      </svg>
    ),
  },
  {
    id: "travel",
    label: "Travel",
    bg: "#e3f6f6",
    fg: "#14a3a3",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4z" />
      </svg>
    ),
  },
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

/** Age-range filter for Discover. Applied server-side on birthdate. */
type AgeBand = { id: string; label: string; min: number; max: number | null };
const AGE_BANDS: AgeBand[] = [
  { id: "18-24", label: "18-24", min: 18, max: 24 },
  { id: "25-34", label: "25-34", min: 25, max: 34 },
  { id: "35-44", label: "35-44", min: 35, max: 44 },
  { id: "45+", label: "45+", min: 45, max: null },
];

function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/** Someone aged min..max was born after (today - max - 1y) and on/before (today - min). */
function birthBounds(b: AgeBand) {
  return {
    born_on_or_before: isoDateYearsAgo(b.min),
    born_after: b.max === null ? null : isoDateYearsAgo(b.max + 1),
  };
}

function inAgeBand(birthdate: string | null, b: AgeBand | null): boolean {
  if (!b) return true;
  if (!birthdate) return false;
  const { born_after, born_on_or_before } = birthBounds(b);
  return birthdate <= born_on_or_before && (!born_after || birthdate > born_after);
}

/** Build a Discover URL that keeps the other active filters. */
function discoverHref(
  intent: string,
  age: string | null,
  interest: string | null = null
): string {
  const params = new URLSearchParams();
  if (intent !== "all") params.set("intent", intent);
  if (age) params.set("age", age);
  if (interest) params.set("interest", interest);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    intent?: string;
    q?: string;
    age?: string;
    interest?: string;
  }>;
}) {
  const sp = await searchParams;
  const active = FILTERS.some((f) => f.id === sp.intent)
    ? (sp.intent as string)
    : "all";
  const q = (sp.q ?? "").trim();
  const ageBand = AGE_BANDS.find((b) => b.id === sp.age) ?? null;
  const interest = isInterest(sp.interest) ? sp.interest : null;
  const isDefault = !q && active === "all" && !ageBand && !interest;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  type WaStatus = "none" | "pending" | "approved" | "declined";
  const nowIso = new Date().toISOString();

  // ---- Wave 1 ----
  // Everything here keys on user.id or on the querystring, so nothing needs
  // to wait for anything else. Two of these used to be their own sequential
  // stages: the outgoing WhatsApp requests ran before this wave, and the
  // intent filter ran after it.
  //
  // The intent filter stays conditional rather than always firing, because
  // "all" is not a real intent and querying for it would return nothing
  // useful. Promise.resolve keeps the tuple shape stable either way.
  const [
    { data: waOutRows },
    { data: blockedRows },
    { data: likedRows },
    { data: boostRows },
    { data: meProfile },
    { data: eventRows },
    { data: intentFilterRows },
  ] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("target_id, status")
      .eq("requester_id", user.id),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("likes").select("liked_id").eq("liker_id", user.id),
    supabase.from("boosts").select("profile_id").gt("expires_at", nowIso),
    supabase
      .from("profiles")
      .select("area, county, onboarding_done")
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
    active === "all"
      ? Promise.resolve({ data: null as { profile_id: string }[] | null })
      : supabase
          .from("profile_intents")
          .select("profile_id")
          .eq("intent", active as Intent),
  ]);

  // Same gate as Home: an unfinished profile goes to onboarding first.
  if (meProfile && !meProfile.onboarding_done) redirect("/onboarding");

  // Each card renders its own WhatsApp state from this map rather than
  // issuing a round trip per card.
  const waOutMap = new Map<string, WaStatus>(
    (waOutRows ?? []).map((r) => [r.target_id, r.status as WaStatus])
  );
  const excludeIds = new Set<string>([
    ...(blockedRows ?? []).map((b) => b.blocked_id),
    ...(likedRows ?? []).map((l) => l.liked_id),
  ]);
  const boostedSet = new Set<string>((boostRows ?? []).map((b) => b.profile_id));
  boostedSet.delete(user.id);

  // Came back in wave 1, so this is pure computation.
  const matchSet: Set<string> | null =
    active === "all"
      ? null
      : new Set((intentFilterRows ?? []).map((r) => r.profile_id));

  // Boosted profiles that pass the current filter — pinned to the top.
  const boostedCandidateIds = [...boostedSet].filter(
    (id) => !excludeIds.has(id) && (!matchSet || matchSet.has(id))
  );
  // ---- Wave 2 ----
  // The boosted pins and the main feed both need wave 1, but neither needs
  // the other. They were two sequential round trips for no reason. Built
  // first, awaited together.
  const boostedQuery = supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified, show_verification"
    )
    .in("id", boostedCandidateIds.length ? boostedCandidateIds : [NO_MATCH])
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false);

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
  if (interest) {
    query = query.contains("interests", [interest]);
  }
  if (ageBand) {
    const { born_after, born_on_or_before } = birthBounds(ageBand);
    query = query.lte("birthdate", born_on_or_before);
    if (born_after) query = query.gt("birthdate", born_after);
  }
  if (q) {
    query = query.ilike("display_name", `%${escapeLike(q.slice(0, 60))}%`);
  }

  const [{ data: boostedData }, { data: feedData }] = await Promise.all([
    boostedQuery,
    query,
  ]);
  // A text search (from Home) filters by name and skips boosted pinning.
  const boostedProfiles =
    q || interest
    ? []
    : (boostedData ?? []).filter((p) => inAgeBand(p.birthdate, ageBand));
  const feedProfiles = (feedData ?? []).filter((p) => !excludeIds.has(p.id));

  const boostedIdSet = new Set(boostedProfiles.map((p) => p.id));
  const profiles = [
    ...boostedProfiles,
    ...feedProfiles.filter((p) => !boostedIdSet.has(p.id)),
  ].slice(0, 60);

  const ids = profiles.map((p) => p.id);
  const intentMap: Record<string, string[]> = {};
  const interestMap: Record<string, string[]> = {};
  const vipSet = new Set<string>();
  const followingSet = new Set<string>();

  // Interests for the cards, viewer's shared interests first. Separate and
  // error-tolerant: the column arrives in migration 0048, and a missing
  // column must only hide the chips, never break the page.
  if (ids.length) {
    const [{ data: interestRows }, { data: myInterestRow }] = await Promise.all([
      supabase.from("profiles").select("id, interests").in("id", ids),
      supabase.from("profiles").select("interests").eq("id", user.id).maybeSingle(),
    ]);
    const mine = new Set(cleanInterests(myInterestRow?.interests));
    (interestRows ?? []).forEach((r) => {
      const list = cleanInterests(r.interests);
      interestMap[r.id] = [
        ...list.filter((i) => mine.has(i)),
        ...list.filter((i) => !mine.has(i)),
      ];
    });
  }

  // ---- Wave 3 ----
  // Card intents, VIP badges and follow state all key on the same resolved
  // id list and nothing else. Three sequential round trips became one, each
  // previously guarded by its own identical `if (ids.length)`.
  if (ids.length) {
    const [{ data: allIntents }, { data: vipRows }, { data: followRows }] =
      await Promise.all([
        supabase
          .from("profile_intents")
          .select("profile_id, intent")
          .in("profile_id", ids),
        supabase
          .from("subscriptions")
          .select("profile_id")
          .in("profile_id", ids)
          .eq("tier", "vip")
          .eq("status", "active")
          .gt("expires_at", nowIso),
        // Own rows only, which is what counts-only RLS permits.
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", ids),
      ]);

    (allIntents ?? []).forEach((r) => {
      (intentMap[r.profile_id] ??= []).push(r.intent);
    });
    (vipRows ?? []).forEach((r) => vipSet.add(r.profile_id));
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

  const activeLabel = FILTERS.find((f) => f.id === active)?.label ?? "";
  const peopleHeading = isDefault
    ? "People to connect with"
    : q
      ? `Results for \u201c${q}\u201d`
      : activeLabel
        ? `People into ${activeLabel}`
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

      <div className="disc2-hint">
        <b>Find people by what they are looking for</b>
        <span>
          Pick Dating, Friendship, Hangouts or Networking. Like someone to
          match (you can message once you both like each other); follow to see
          their posts without matching.
        </span>
        {!isDefault && (
          <Link href="/discover" className="disc2-reset">
            Reset filters
          </Link>
        )}
      </div>

      <div
        className="disc2-cats"
        role="group"
        aria-label="Find people by interest"
      >
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={discoverHref(f.id, ageBand?.id ?? null, interest)}
            className={"disc2-cat" + (active === f.id ? " on" : "")}
            style={{ "--cat-bg": f.bg, "--cat-fg": f.fg } as CSSProperties}
            aria-current={active === f.id ? "page" : undefined}
          >
            <span className="disc2-cat-ico" aria-hidden="true">
              {f.icon}
            </span>
            <span className="disc2-cat-label">{f.label}</span>
          </Link>
        ))}
      </div>

      <div className="disc2-ages" role="group" aria-label="Filter by age">
        <span className="disc2-ages-label">Age</span>
        <Link
          href={discoverHref(active, null, interest)}
          className={"disc2-age" + (ageBand ? "" : " on")}
          aria-current={ageBand ? undefined : "page"}
        >
          Any
        </Link>
        {AGE_BANDS.map((b) => (
          <Link
            key={b.id}
            href={discoverHref(active, b.id, interest)}
            className={"disc2-age" + (ageBand?.id === b.id ? " on" : "")}
            aria-current={ageBand?.id === b.id ? "page" : undefined}
          >
            {b.label}
          </Link>
        ))}
      </div>

      <div className="disc2-ages" role="group" aria-label="Filter by interest">
        <span className="disc2-ages-label">Into</span>
        <Link
          href={discoverHref(active, ageBand?.id ?? null, null)}
          className={"disc2-age" + (interest ? "" : " on")}
          aria-current={interest ? undefined : "page"}
        >
          Anything
        </Link>
        {DISCOVER_INTERESTS.map((it) => (
          <Link
            key={it}
            href={discoverHref(active, ageBand?.id ?? null, it)}
            className={"disc2-age" + (interest === it ? " on" : "")}
            aria-current={interest === it ? "page" : undefined}
          >
            {it}
          </Link>
        ))}
      </div>

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
                  interests={interestMap[p.id] ?? []}
                  boosted={boostedIdSet.has(p.id)}
                  vip={vipSet.has(p.id)}
                  showFollow
                  following={followingSet.has(p.id)}
                  contactShare={
                    <WhatsAppAskButton
                      otherId={p.id}
                      otherName={p.display_name}
                      outgoing={waOutMap.get(p.id) ?? "none"}
                    />
                  }
                />
              );
            })}
          </div>
        )}
      </section>

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

    </main>
  );
}
