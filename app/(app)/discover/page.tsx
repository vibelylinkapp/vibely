import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import BottomNav from "@/components/BottomNav";
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

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const sp = await searchParams;
  const active = sp.intent ?? "all";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const nowIso = new Date().toISOString();

  const [{ data: blockedRows }, { data: likedRows }, { data: boostRows }] =
    await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      supabase.from("likes").select("liked_id").eq("liker_id", user.id),
      supabase.from("boosts").select("profile_id").gt("expires_at", nowIso),
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
  const boostedProfiles = boostedData ?? [];

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

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <div className="feed-head-l">
          <span className="feed-title">Discover</span>
          <span className="feed-sub">Find people, places and vibes around you</span>
        </div>
        <div className="feed-actions">
          <Link
            href="/nearby"
            className="feed-action nearby"
            aria-label="People nearby"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </Link>
          <Link
            href="/liked-you"
            className="feed-action"
            aria-label="See who likes you"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7l.6.6.6-.6a5 5 0 0 1 7.1 7z" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="filter-row">
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

      {profiles.length === 0 ? (
        <p className="sub" style={{ textAlign: "center", marginTop: 40 }}>
          You&apos;re all caught up. As more people join Vibely — or once you
          clear your current likes — new faces will show up here. Invite a
          friend to sign up and watch this fill in.
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
              />
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
