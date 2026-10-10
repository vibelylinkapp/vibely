/**
 * Fixed-window, per-IP request limiter used by middleware for every /api
 * route. In-memory, so the limit is per serverless/edge instance. That is
 * enough to stop a single client hammering an endpoint; for a global limit
 * swap the Map for Upstash Redis or Vercel KV (same interface).
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type Rule = { max: number; windowMs: number };

/** Per-route budgets. The first matching prefix wins. */
export const API_RULES: Array<[prefix: string, rule: Rule]> = [
  ["/api/auth/", { max: 10, windowMs: 10 * 60_000 }],
  ["/api/account/delete", { max: 5, windowMs: 60 * 60_000 }],
  ["/api/mpesa/stkpush", { max: 10, windowMs: 10 * 60_000 }],
  ["/api/events/stkpush", { max: 10, windowMs: 10 * 60_000 }],
  ["/api/mpesa/callback", { max: 300, windowMs: 60_000 }],
  ["/api/push/send", { max: 60, windowMs: 60_000 }],
  ["/api/", { max: 120, windowMs: 60_000 }],
];

export function ruleFor(pathname: string): Rule | null {
  for (const [prefix, rule] of API_RULES) {
    if (pathname.startsWith(prefix)) return rule;
  }
  return null;
}

/** Returns seconds to wait when limited, or 0 when the request may proceed. */
export function hit(key: string, rule: Rule): number {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return 0;
  }
  b.count += 1;
  return b.count > rule.max ? Math.ceil((b.resetAt - now) / 1000) : 0;
}
