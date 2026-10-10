/**
 * Interests members can add to their profile (profiles.interests, migration
 * 0048). A fixed list keeps the Discover filter meaningful and stops free-text
 * tags from becoming a spam or abuse channel.
 */
export const INTERESTS = [
  "Music",
  "Afrobeats",
  "Amapiano",
  "Gospel",
  "Dancing",
  "Football",
  "Gym",
  "Running",
  "Hiking",
  "Road trips",
  "Travel",
  "Beach",
  "Cooking",
  "Food",
  "Coffee",
  "Movies",
  "Series",
  "Reading",
  "Art",
  "Photography",
  "Fashion",
  "Gaming",
  "Tech",
  "Startups",
  "Business",
  "Volunteering",
  "Faith",
  "Pets",
] as const;

export type Interest = (typeof INTERESTS)[number];

/** Members can pick at most this many. Matches the database check. */
export const MAX_INTERESTS = 8;

/** Shown as quick filters on Discover. */
export const DISCOVER_INTERESTS: Interest[] = [
  "Music",
  "Football",
  "Gym",
  "Hiking",
  "Travel",
  "Food",
  "Movies",
  "Tech",
  "Business",
  "Faith",
];

const SET = new Set<string>(INTERESTS);

/** Keep only known interests, de-duplicated and capped. */
export function cleanInterests(values: unknown): Interest[] {
  if (!Array.isArray(values)) return [];
  const out: Interest[] = [];
  for (const v of values) {
    if (typeof v === "string" && SET.has(v) && !out.includes(v as Interest)) {
      out.push(v as Interest);
    }
    if (out.length >= MAX_INTERESTS) break;
  }
  return out;
}

export function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && SET.has(value);
}
