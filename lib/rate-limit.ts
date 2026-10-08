import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Rate limiting for the two STK push routes (SECURITY-AUDIT.md, MEDIUM-1).
 *
 * Every STK push makes Safaricom send a real PIN prompt to whatever number
 * was typed in, so an unlimited endpoint is a harassment tool aimed at
 * people who never used Vibely. The limit is counted from the payments
 * table itself, so it holds across every serverless instance without any
 * extra infrastructure or migration.
 */
export const STK_WINDOW_MINUTES = 10;
export const STK_MAX_PER_USER = 3;
export const STK_MAX_PER_PHONE = 3;

export async function stkRateLimited(
  admin: SupabaseClient<Database>,
  userId: string,
  phone: string
): Promise<boolean> {
  const since = new Date(
    Date.now() - STK_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const [byUser, byPhone] = await Promise.all([
    admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .gte("created_at", since),
    admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since),
  ]);

  return (
    (byUser.count ?? 0) >= STK_MAX_PER_USER ||
    (byPhone.count ?? 0) >= STK_MAX_PER_PHONE
  );
}

/**
 * Best-effort per-IP limiter for unauthenticated routes (signup).
 *
 * In-memory, so it is per serverless instance rather than global. That
 * still stops a single client hammering the route, which is the common
 * case. A global limit would need a shared store (Upstash, or a table).
 */
const hits = new Map<string, number[]>();

export function ipRateLimited(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
