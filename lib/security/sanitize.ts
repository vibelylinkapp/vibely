/**
 * Input sanitisation helpers shared by route handlers and server actions.
 *
 * React already escapes everything it renders, so these helpers are not an
 * XSS filter for HTML. They exist to:
 *   - reject malformed identifiers before they reach a database filter,
 *   - strip control characters and cap the length of free text,
 *   - stop user-supplied URLs from carrying `javascript:` or `data:` schemes,
 *   - escape LIKE wildcards so a search box cannot match "everything".
 *
 * All database access goes through supabase-js / PostgREST, which sends
 * values as parameters rather than concatenated SQL. That is the primary
 * SQL-injection control; these helpers are defence in depth.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// C0/C1 control characters, except tab (\x09), newline (\x0A) and CR (\x0D).
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

// Zero-width and bidi-override characters used to spoof text direction.
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** True when the value is a canonical RFC 4122 UUID. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Return the value when it is a UUID, otherwise null. */
export function asUuid(value: unknown): string | null {
  return isUuid(value) ? value.toLowerCase() : null;
}

/**
 * Normalise free text: coerce to string, NFC-normalise, drop control and
 * invisible characters, collapse runs of blank lines, trim and cap length.
 */
export function cleanText(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(CONTROL_RE, "")
    .replace(INVISIBLE_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Single-line variant of cleanText (newlines become spaces). */
export function cleanLine(value: unknown, maxLength = 200): string {
  return cleanText(value, maxLength * 2)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Escape `%`, `_` and `\\` so a value can be used inside an ILIKE pattern as
 * a literal substring.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Accept only a site-relative path ("/events/123") or an absolute http(s)
 * URL. Everything else - `javascript:`, `data:`, `vbscript:`, protocol-
 * relative "//host" - returns null.
 */
export function safeLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > 2048) return null;
  if (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) return v;
  try {
    const url = new URL(v);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** Basic, deliberately strict email shape check (RFC 5321 length caps). */
export function isEmail(value: string): boolean {
  return (
    value.length <= 254 &&
    /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(value)
  );
}
