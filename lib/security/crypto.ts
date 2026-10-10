import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison for shared secrets (webhook tokens, cron
 * bearer tokens). A plain `===` returns early on the first differing byte,
 * which leaks how much of a guess was right through response timing.
 *
 * Both sides are hashed first so inputs of different lengths can still be
 * compared without throwing and without leaking the expected length.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Verify an `Authorization: Bearer <secret>` header against an env secret. */
export function hasBearer(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(token, secret);
}
