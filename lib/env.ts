/**
 * Central place for environment configuration.
 *
 * No secret is ever hard-coded in this repository: every key is read from the
 * environment (Vercel Project Settings -> Environment Variables locally via
 * .env.local). See .env.example for the full list.
 *
 * Only variables prefixed NEXT_PUBLIC_ are shipped to the browser. Everything
 * else stays on the server.
 */

/** Canonical public URL of the site, used for SEO, sitemaps and callbacks. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://vibely-inky.vercel.app"
).replace(/\/+$/, "");

/** Contact used in the VAPID JWT so push services can reach the operator. */
export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:hello@vibely.co.ke";

/** Server-only variables that must exist for the app to run correctly. */
const REQUIRED_SERVER = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/** Names of required variables that are missing (empty array when healthy). */
export function missingServerEnv(): string[] {
  return REQUIRED_SERVER.filter((k) => !process.env[k]);
}
