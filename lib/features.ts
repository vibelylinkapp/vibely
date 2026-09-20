/**
 * Feature flags for surfaces that need density to look alive.
 *
 * Vibely has 15 profiles and 6 events. Stories rails, a social feed, a
 * heatmap and "top matches" are all built and all correct, but with this
 * many members they render as empty shells - and an empty social app reads
 * as dead, which is worse than a small one that works.
 *
 * Nothing here is deleted. Each surface is one env var away from coming
 * back the moment there are enough people to fill it. Flip a value in
 * Vercel, redeploy, and the code is already there.
 *
 * Defaults are OFF for the density-dependent surfaces. To enable one:
 *   NEXT_PUBLIC_FEATURE_STORIES=1
 */
function on(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const FEATURES = {
  /** Stories rail on Home. Needs a steady stream of daily posters. */
  stories: on(process.env.NEXT_PUBLIC_FEATURE_STORIES, false),

  /** Social feed on Home. Empty until people post regularly. */
  feed: on(process.env.NEXT_PUBLIC_FEATURE_FEED, false),

  /** Live heatmap. Meaningless, and identifying, at low density. */
  heatmap: on(process.env.NEXT_PUBLIC_FEATURE_HEATMAP, false),

  /** "Top matches" ranking. Needs a pool to rank. */
  topMatches: on(process.env.NEXT_PUBLIC_FEATURE_TOP_MATCHES, false),

  /** Paid boosts. Selling reach into a 15-person pool is not honest yet. */
  boosts: on(process.env.NEXT_PUBLIC_FEATURE_BOOSTS, false),

  /**
   * Chats as a bottom-nav tab. Off by default: WhatsApp is the
   * conversation layer, so Events takes the slot. /messages still works
   * and is reachable from the Home header - this only controls the tab.
   */
  chatTab: on(process.env.NEXT_PUBLIC_FEATURE_CHAT_TAB, false),
};

export type FeatureName = keyof typeof FEATURES;
