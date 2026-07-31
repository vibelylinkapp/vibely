import { TIER_RANK } from "@/lib/tiers";

export type EffectiveSub = { tier: string; rank: number; isPaid: boolean };

// Compute a member's effective tier from their subscription row, honouring
// status + expiry. An expired or non-active subscription counts as "free".
export function effectiveTier(
  sub: {
    tier?: string | null;
    status?: string | null;
    expires_at?: string | null;
  } | null
): EffectiveSub {
  const active =
    sub?.status === "active" &&
    (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now());
  const tier = active ? sub?.tier ?? "free" : "free";
  const rank = TIER_RANK[tier] ?? 0;
  return { tier, rank, isPaid: rank > 0 };
}

// Free members get a daily like cap; paid tiers are unlimited.
export const FREE_DAILY_LIKE_LIMIT = 15;

// Monthly boost quota by tier. null = unlimited.
export const BOOST_QUOTA: Record<string, number | null> = {
  free: 0,
  plus: 0,
  gold: 5,
  vip: null,
};
