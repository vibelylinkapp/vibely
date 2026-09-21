import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Who to show in "People near you".
 *
 * The old query was:
 *
 *   .order("last_active_at", { ascending: false, nullsFirst: false })
 *   .limit(18)              // then .slice(0, 8)
 *
 * Nothing in the app ever writes last_active_at -- only the seed
 * migrations do -- so 10 demo profiles carried a timestamp frozen at
 * migration time and every real member had NULL. With nullsFirst: false
 * the demo rows always sorted first, in the same order, so the homepage
 * showed the identical eight faces on every reload and real members were
 * never reachable at all.
 *
 * What other apps do is not "ORDER BY random()" -- that is a full scan
 * plus a sort on every request, and it happily surfaces empty profiles.
 * They score a bounded candidate pool on real signals, then add enough
 * randomness to keep the deck fresh between visits, and they never show
 * someone you have already acted on.
 *
 * So: pull a pool, drop anyone blocked/liked/passed, score on recency,
 * locality, verification and whether there is actually a photo, add a
 * jitter large enough to reshuffle neighbours, and take the top N.
 */

export type NearbyPerson = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  area: string | null;
  county: string | null;
  is_online: boolean;
  birthdate: string | null;
  is_verified: boolean;
};

// Jitter is deliberately comparable to the gap between adjacent score
// bands. Smaller and the order barely moves between reloads; much larger
// and ranking stops meaning anything.
const JITTER = 35;

const POOL = 120;

function recencyScore(lastActiveAt: string | null, isOnline: boolean): number {
  if (isOnline) return 38;
  if (!lastActiveAt) return 0;
  const ageMs = Date.now() - new Date(lastActiveAt).getTime();
  if (Number.isNaN(ageMs)) return 0;
  const hours = ageMs / 3600000;
  if (hours < 1) return 40;
  if (hours < 24) return 30;
  if (hours < 24 * 7) return 20;
  if (hours < 24 * 30) return 10;
  return 4;
}

export async function pickPeopleNearYou(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: {
    limit?: number;
    blocked?: Set<string>;
    viewerArea?: string | null;
    viewerCounty?: string | null;
  } = {}
): Promise<NearbyPerson[]> {
  const limit = opts.limit ?? 8;
  const blocked = opts.blocked ?? new Set<string>();

  // One wave: the candidate pool plus the two "already acted on" lists.
  const [poolRes, likesRes, passesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, area, county, is_online, birthdate, is_verified, last_active_at"
      )
      .eq("onboarding_done", true)
      .eq("is_private", false)
      .eq("invisible_mode", false)
      .eq("is_banned", false)
      .neq("id", userId)
      .limit(POOL),
    supabase.from("likes").select("liked_id").eq("liker_id", userId),
    supabase.from("passes").select("passed_id").eq("passer_id", userId),
  ]);

  const seen = new Set<string>(blocked);
  (likesRes.data ?? []).forEach((l) => seen.add(l.liked_id));
  (passesRes.data ?? []).forEach((p) => seen.add(p.passed_id));

  const candidates = (poolRes.data ?? []).filter((p) => !seen.has(p.id));

  const scored = candidates.map((p) => {
    let score = recencyScore(p.last_active_at, Boolean(p.is_online));

    // A profile with no photo is a dead end for the viewer, so it should
    // rarely lead -- but still appear sometimes rather than never.
    score += p.avatar_url ? 14 : -18;

    if (p.is_verified) score += 10;

    // Locality: "near you" should mean something.
    if (opts.viewerArea && p.area && p.area.toLowerCase() === opts.viewerArea.toLowerCase()) {
      score += 16;
    } else if (
      opts.viewerCounty &&
      p.county &&
      p.county.toLowerCase() === opts.viewerCounty.toLowerCase()
    ) {
      score += 8;
    }

    if (p.display_name) score += 4;

    return { p, rank: score + Math.random() * JITTER };
  });

  scored.sort((a, b) => b.rank - a.rank);

  return scored.slice(0, limit).map(({ p }) => ({
    id: p.id,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    area: p.area,
    county: p.county,
    is_online: Boolean(p.is_online),
    birthdate: p.birthdate,
    is_verified: Boolean(p.is_verified),
  }));
}

/**
 * Keep last_active_at truthful.
 *
 * It is the strongest signal we have for ranking, but nothing was writing
 * it, so it was dead data. Touch it when the member loads the homepage,
 * throttled so we are not writing on every navigation.
 */
export async function touchLastActive(
  supabase: SupabaseClient<Database>,
  userId: string,
  current: string | null
): Promise<void> {
  const THROTTLE_MS = 5 * 60 * 1000;
  if (current) {
    const age = Date.now() - new Date(current).getTime();
    if (!Number.isNaN(age) && age < THROTTLE_MS) return;
  }
  // Best effort: a failed presence ping must never break the page.
  try {
    await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    /* ignore */
  }
}
