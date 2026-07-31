import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import ProfileCard from "@/components/ProfileCard";
import { effectiveTier } from "@/lib/entitlements";
import { TIER_RANK } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const NO_MATCH = "00000000-0000-0000-0000-000000000000";

export default async function LikedYouPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  const ent = effectiveTier(sub);

  // People who liked me, and the people I've already liked (to exclude).
  const [{ data: likedRows }, { data: myLikes }] = await Promise.all([
    supabase.from("likes").select("liker_id").eq("liked_id", user.id),
    supabase.from("likes").select("liked_id").eq("liker_id", user.id),
  ]);
  const myLikedSet = new Set((myLikes ?? []).map((r) => r.liked_id));
  const pendingIds = (likedRows ?? [])
    .map((r) => r.liker_id)
    .filter((id) => !myLikedSet.has(id));
  const count = pendingIds.length;

  const isPlus = ent.rank >= TIER_RANK.plus;

  if (!isPlus) {
    return (
      <main className="feed-wrap">
        <div className="feed-head">
          <span className="feed-title">Who likes you</span>
        </div>
        <div className="paywall">
          <div className="paywall-count">{count}</div>
          <p className="paywall-title">
            {count === 1 ? "1 person likes you" : `${count} people like you`}
          </p>
          <p className="sub">
            Upgrade to Vibely Plus to see who they are and match instantly.
          </p>
          <Link href="/upgrade" className="btn paywall-cta">
            See who likes you
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  const { data: profilesData } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified"
    )
    .in("id", pendingIds.length ? pendingIds : [NO_MATCH])
    .eq("is_private", false)
    .eq("is_banned", false);
  const profiles = profilesData ?? [];

  const intentMap: Record<string, string[]> = {};
  const ids = profiles.map((p) => p.id);
  if (ids.length) {
    const { data: allIntents } = await supabase
      .from("profile_intents")
      .select("profile_id, intent")
      .in("profile_id", ids);
    (allIntents ?? []).forEach((r) => {
      (intentMap[r.profile_id] ??= []).push(r.intent);
    });
  }

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Who likes you</span>
      </div>
      {profiles.length === 0 ? (
        <p className="sub" style={{ textAlign: "center", marginTop: 40 }}>
          No new admirers right now. When someone likes you, they&apos;ll show
          up here so you can like them back and match instantly.
        </p>
      ) : (
        <div className="grid">
          {profiles.map((p) => (
            <ProfileCard key={p.id} p={p} intents={intentMap[p.id] ?? []} />
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
