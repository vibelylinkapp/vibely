import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import ProfileCard from "@/components/ProfileCard";
import { effectiveTier } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

const NO_MATCH = "00000000-0000-0000-0000-000000000000";
const POOL_LIMIT = 120;
const TOP_N = 12;

type Candidate = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  county: string | null;
  area: string | null;
  birthdate: string | null;
  is_online: boolean;
  is_verified: boolean | null;
};

function reasonFor(
  shared: number,
  sameCounty: boolean,
  county: string | null,
  verified: boolean
): string {
  const bits: string[] = [];
  if (shared > 0) {
    bits.push(`${shared} shared ${shared === 1 ? "interest" : "interests"}`);
  }
  if (sameCounty && county) bits.push(county);
  if (verified) bits.push("Verified");
  return bits.length ? bits.join(" \u00b7 ") : "Suggested for you";
}

export default async function TopMatchesPage() {
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
  const isVip = effectiveTier(sub).tier === "vip";

  if (!isVip) {
    return (
      <main className="feed-wrap">
        <div className="feed-head">
          <span className="feed-title">Top matches</span>
        </div>
        <div className="paywall">
          <div className="paywall-count">VIP</div>
          <p className="paywall-title">Direct intros to your top matches</p>
          <p className="sub">
            Vibely VIP hand-picks your best matches across Kenya &mdash; ranked
            by shared interests, location, and verification &mdash; so you skip
            the scrolling and meet the right people first.
          </p>
          <Link href="/upgrade" className="btn paywall-cta">
            Go VIP
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // My profile (for same-county weighting) and my interests.
  const [{ data: me }, { data: myIntentRows }] = await Promise.all([
    supabase.from("profiles").select("county").eq("id", user.id).maybeSingle(),
    supabase.from("profile_intents").select("intent").eq("profile_id", user.id),
  ]);
  const myCounty = me?.county ?? null;
  const myIntents = new Set<string>((myIntentRows ?? []).map((r) => r.intent));

  // People I've already liked or blocked are not "intros".
  const [{ data: likedRows }, { data: blockedRows }] = await Promise.all([
    supabase.from("likes").select("liked_id").eq("liker_id", user.id),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
  ]);
  const exclude = new Set<string>([
    user.id,
    ...(likedRows ?? []).map((r) => r.liked_id),
    ...(blockedRows ?? []).map((r) => r.blocked_id),
  ]);

  // Candidate pool: visible, active members, most-recently-active first.
  const { data: poolData } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified"
    )
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false)
    .eq("is_banned", false)
    .neq("id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(POOL_LIMIT);
  const pool = (poolData ?? []).filter((p) => !exclude.has(p.id));

  // Interests for everyone in the pool, to score shared interests.
  const poolIds = pool.map((p) => p.id);
  const intentsByProfile: Record<string, string[]> = {};
  if (poolIds.length) {
    const { data: allIntents } = await supabase
      .from("profile_intents")
      .select("profile_id, intent")
      .in("profile_id", poolIds);
    (allIntents ?? []).forEach((r) => {
      (intentsByProfile[r.profile_id] ??= []).push(r.intent);
    });
  }

  // Score + rank.
  const ranked = pool
    .map((p) => {
      const theirIntents = intentsByProfile[p.id] ?? [];
      const shared = theirIntents.filter((i) => myIntents.has(i)).length;
      const sameCounty = !!myCounty && p.county === myCounty;
      const verified = !!p.is_verified;
      const score =
        shared * 10 + (sameCounty ? 4 : 0) + (verified ? 2 : 0) + (p.is_online ? 2 : 0);
      return {
        p: p as Candidate,
        intents: theirIntents,
        score,
        reason: reasonFor(shared, sameCounty, p.county, verified),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  // VIP badges among the shown matches.
  const shownIds = ranked.map((r) => r.p.id);
  const vipSet = new Set<string>();
  if (shownIds.length) {
    const nowIso = new Date().toISOString();
    const { data: vipRows } = await supabase
      .from("subscriptions")
      .select("profile_id")
      .in("profile_id", shownIds.length ? shownIds : [NO_MATCH])
      .eq("tier", "vip")
      .eq("status", "active")
      .gt("expires_at", nowIso);
    (vipRows ?? []).forEach((r) => vipSet.add(r.profile_id));
  }

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Top matches</span>
        <span className="vip-badge">VIP</span>
      </div>
      <p className="sub" style={{ marginBottom: 12 }}>
        Hand-picked for you by shared interests, location, and verification.
      </p>

      {ranked.length === 0 ? (
        <p className="sub" style={{ textAlign: "center", marginTop: 40 }}>
          No new matches to introduce right now. As more people join Vibely
          &mdash; or once you clear your current likes &mdash; your top matches
          will appear here.
        </p>
      ) : (
        <div className="grid">
          {ranked.map((r) => (
            <ProfileCard
              key={r.p.id}
              p={r.p}
              intents={r.intents}
              reason={r.reason}
              vip={vipSet.has(r.p.id)}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
