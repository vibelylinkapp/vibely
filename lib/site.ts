/**
 * Single source of truth for the details that appear across the marketing and
 * legal pages. Everything marked TODO must be filled in before launch — the
 * pages read from here so you only have to change it in one place.
 */
export const SITE = {
  name: "Vibely",

  /** TODO: replace with the registered company name once incorporated. */
  legalEntity: "Vibely",

  city: "Nairobi",
  country: "Kenya",

  /** TODO: point these at inboxes that are actually monitored. */
  contactEmail: "hello@vibely.co.ke",
  supportEmail: "support@vibely.co.ke",
  privacyEmail: "privacy@vibely.co.ke",

  /** Shown on the legal pages. Update whenever the wording changes. */
  lastUpdated: "20 September 2026",

  /** Minimum age to hold a Vibely account. */
  minAge: 18,

  /**
   * Store listings. While these are null the landing page shows an honest
   * "coming soon" state instead of dead buttons. Set them to the live listing
   * URLs and the real badges appear automatically.
   */
  stores: {
    googlePlay: null as string | null,
    appStore: null as string | null,
  },
} as const;

export const hasStoreLinks = Boolean(
  SITE.stores.googlePlay || SITE.stores.appStore
);
