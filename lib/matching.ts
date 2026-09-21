/**
 * Compatibility scoring for "% match".
 *
 * The old scoring was one line on the homepage:
 *
 *   const shared = theirs.filter((t) => mine.has(t)).length;
 *   match = shared > 0 ? Math.min(99, 72 + shared * 9) : null;
 *
 * Three things are wrong with that, all visible in the live data:
 *
 *  1. No normalisation. A member who ticks all 12 intents overlaps with
 *     almost everybody and scores 90%+ against all of them, while a
 *     member with 2 intents can never exceed 90% however perfect the
 *     fit. Breadth beat compatibility.
 *  2. Every intent counted the same. In the current data `friendship`,
 *     `dating` and `coffee` appear in most profiles, so sharing one says
 *     almost nothing, while `weekend` or `business` appears in 2-3 and
 *     says a great deal. Treating them identically throws away the only
 *     genuinely discriminating signal.
 *  3. It mixed two different questions. The intent_t enum holds BOTH
 *     "what am I here for" (dating / friendship / hangout / weekend) and
 *     "what do I like doing" (gym / hiking / coffee / ...). Someone
 *     looking to date and someone looking only to network are not a
 *     match because they both ticked coffee.
 *
 * So: separate the two questions, weight shared interests by how rare
 * they are (inverse document frequency, the standard approach), and
 * normalise by the union so breadth cannot inflate a score.
 *
 * Deliberately NOT part of this score: recency and online status. Those
 * decide WHO YOU SEE, and they belong in ranking (lib/discovery.ts).
 * They say nothing about whether two people are compatible, and folding
 * them in here would make the number drift for reasons a member cannot
 * understand.
 */

/** "What am I here for" -- a compatibility question. */
export const RELATIONSHIP_INTENTS = new Set([
  "dating",
  "friendship",
  "hangout",
  "weekend",
]);

/** "What do I like doing" -- an affinity question. */
export const ACTIVITY_INTENTS = new Set([
  "gym",
  "hiking",
  "coffee",
  "networking",
  "business",
  "travel",
  "movies",
  "nightlife",
]);

export type IdfMap = Map<string, number>;

/**
 * Inverse document frequency per intent, from how many profiles hold it.
 *
 * weight = ln(1 + total / (1 + holders))
 *
 * A near-universal intent tends toward 0; a rare one is worth several
 * times more. The +1s keep it defined when an intent has no holders.
 */
export function buildIdf(
  intentRows: { intent: string }[],
  totalProfiles: number
): IdfMap {
  const holders = new Map<string, number>();
  for (const r of intentRows) {
    holders.set(r.intent, (holders.get(r.intent) ?? 0) + 1);
  }
  const total = Math.max(1, totalProfiles);
  const idf: IdfMap = new Map();
  for (const [intent, n] of holders) {
    idf.set(intent, Math.log(1 + total / (1 + n)));
  }
  return idf;
}

function weight(idf: IdfMap, intent: string): number {
  // Unseen intent: treat as averagely informative rather than free.
  return idf.get(intent) ?? 0.7;
}

function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) a -= 1;
  return a >= 0 && a < 120 ? a : null;
}

export type MatchInput = {
  myIntents: string[];
  myBirthdate: string | null;
  myArea: string | null;
  myCounty: string | null;
  theirIntents: string[];
  theirBirthdate: string | null;
  theirArea: string | null;
  theirCounty: string | null;
};

export type MatchResult = {
  /** 45-97 when there is real signal, else null. Never invent a number. */
  score: number | null;
  /** Shared activity interests, rarest first -- for "why" in the UI. */
  sharedActivities: string[];
  /** Shared relationship intents. */
  sharedRelationship: string[];
};

const W_ACTIVITY = 0.5;
const W_RELATIONSHIP = 0.28;
const W_AGE = 0.14;
const W_LOCALITY = 0.08;

export function scoreMatch(input: MatchInput, idf: IdfMap): MatchResult {
  const mine = new Set(input.myIntents);
  const theirs = new Set(input.theirIntents);

  const myAct = input.myIntents.filter((i) => ACTIVITY_INTENTS.has(i));
  const theirAct = input.theirIntents.filter((i) => ACTIVITY_INTENTS.has(i));
  const myRel = input.myIntents.filter((i) => RELATIONSHIP_INTENTS.has(i));
  const theirRel = input.theirIntents.filter((i) => RELATIONSHIP_INTENTS.has(i));

  const sharedActivities = myAct.filter((i) => theirs.has(i));
  const sharedRelationship = myRel.filter((i) => theirs.has(i));

  // No overlap at all: say nothing rather than print a fake number.
  if (sharedActivities.length === 0 && sharedRelationship.length === 0) {
    return { score: null, sharedActivities: [], sharedRelationship: [] };
  }

  // --- activity affinity: IDF-weighted Jaccard over the union ---------
  const union = new Set([...myAct, ...theirAct]);
  let sharedW = 0;
  for (const i of sharedActivities) sharedW += weight(idf, i);
  let unionW = 0;
  for (const i of union) unionW += weight(idf, i);
  const activityScore = unionW > 0 ? sharedW / unionW : 0.3;

  // --- relationship compatibility ------------------------------------
  // Normalise against the NARROWER of the two sets: if I want only
  // dating and they want dating plus three other things, that is still
  // a full match on what I came for.
  const relDenom = Math.min(myRel.length, theirRel.length);
  const relationshipScore =
    relDenom > 0
      ? sharedRelationship.length / relDenom
      : 0.5; // unstated on one side: neutral, do not punish

  // --- age proximity --------------------------------------------------
  const myAge = ageFromBirthdate(input.myBirthdate);
  const theirAge = ageFromBirthdate(input.theirBirthdate);
  const ageScore =
    myAge !== null && theirAge !== null
      ? 1 - Math.min(1, Math.abs(myAge - theirAge) / 15)
      : 0.5;

  // --- locality -------------------------------------------------------
  const sameArea =
    Boolean(input.myArea) &&
    Boolean(input.theirArea) &&
    input.myArea!.trim().toLowerCase() === input.theirArea!.trim().toLowerCase();
  const sameCounty =
    Boolean(input.myCounty) &&
    Boolean(input.theirCounty) &&
    input.myCounty!.trim().toLowerCase() ===
      input.theirCounty!.trim().toLowerCase();
  const localityScore = sameArea ? 1 : sameCounty ? 0.6 : 0.25;

  const raw =
    W_ACTIVITY * activityScore +
    W_RELATIONSHIP * relationshipScore +
    W_AGE * ageScore +
    W_LOCALITY * localityScore;

  // Calibrate into a believable band. A shown score should never be so
  // low it reads as an insult, nor 99% for a single shared interest.
  const score = Math.round(45 + 52 * Math.max(0, Math.min(1, raw)));

  // Rarest shared interests first: they are the most worth naming.
  sharedActivities.sort((a, b) => weight(idf, b) - weight(idf, a));

  return { score, sharedActivities, sharedRelationship };
}
