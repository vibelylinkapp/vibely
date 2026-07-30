// Vibely paid tiers. Prices are in KES per month.
// To change pricing, edit TIER_PRICES (and the price on each TIERS entry).
export type PaidTier = "plus" | "gold" | "vip";
export type Tier = "free" | PaidTier;

export const TIER_PRICES: Record<PaidTier, number> = {
  plus: 249,
  gold: 499,
  vip: 899,
};

export const TIERS: {
  id: PaidTier;
  name: string;
  price: number;
  perks: string[];
}[] = [
  {
    id: "plus",
    name: "Vibely Plus",
    price: TIER_PRICES.plus,
    perks: ["Unlimited likes", "See who liked you", "Ad-free experience"],
  },
  {
    id: "gold",
    name: "Vibely Gold",
    price: TIER_PRICES.gold,
    perks: [
      "Everything in Plus",
      "Priority in Discover",
      "5 profile boosts / month",
    ],
  },
  {
    id: "vip",
    name: "Vibely VIP",
    price: TIER_PRICES.vip,
    perks: [
      "Everything in Gold",
      "VIP badge on your profile",
      "Unlimited boosts",
      "Direct intros to top matches",
    ],
  },
];

// Ranking so we can tell whether a tier is an upgrade over the current one.
export const TIER_RANK: Record<string, number> = {
  free: 0,
  plus: 1,
  gold: 2,
  vip: 3,
};

// How long one payment keeps a subscription active.
export const SUBSCRIPTION_DAYS = 30;
