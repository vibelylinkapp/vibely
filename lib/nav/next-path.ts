/**
 * Validate a post-login redirect target.
 *
 * Anything that reaches redirect() straight from a query string is an
 * open-redirect hole: "/sign-in?next=https://evil.example" would bounce a
 * freshly authenticated member off the site with a valid session in hand.
 * Only site-relative, single-slash paths pass; callers fall back to a
 * default when this returns null.
 */
export function safeNextPath(
  raw: string | string[] | undefined | null
): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first === undefined || first === null) return null;

  const v = first.trim();
  if (v.length === 0) return null;
  if (v.startsWith("/") === false) return null;
  // Protocol-relative escapes such as "//host" are not local paths.
  if (v.startsWith("//")) return null;
  if (v.includes("\\")) return null;
  if (v.includes("://")) return null;

  return v;
}
