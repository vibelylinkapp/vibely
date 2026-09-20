/**
 * Single source of truth for the details that appear across the marketing and
 * legal pages. The pages read from here, so change it in one place.
 */
export const SITE = {
  name: "Vibely",

  /** The entity named on the legal pages and in the footer copyright. */
  legalEntity: "Vibely App",

  city: "Nairobi",
  country: "Kenya",

  contactEmail: "hello@vibely.co.ke",
  supportEmail: "hello@vibely.co.ke",
  privacyEmail: "hello@vibely.co.ke",

  /** Shown on the legal pages. Update whenever the wording changes. */
  lastUpdated: "20 September 2026",

  /** Minimum age to hold a Vibely account. Enforced by a database trigger. */
  minAge: 18,

  /**
   * How long we take to action a data deletion or access request, in days.
   * Keep this in step with what the privacy page promises.
   */
  dataRequestDays: 30,

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
