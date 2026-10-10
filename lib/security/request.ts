/**
 * Helpers for reading untrusted request bodies safely in route handlers.
 */

/** Largest JSON body any of our API routes legitimately receives. */
export const MAX_JSON_BYTES = 16 * 1024;

/**
 * Parse a JSON object body with a size cap. Returns null for anything that is
 * not a plain JSON object, so callers never index into arrays or primitives.
 */
export async function readJsonObject<T extends Record<string, unknown>>(
  req: Request,
  maxBytes = MAX_JSON_BYTES
): Promise<Partial<T> | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  let text: string;
  try {
    text = await req.text();
  } catch {
    return null;
  }
  if (text.length > maxBytes) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Partial<T>;
  } catch {
    return null;
  }
}

/** Log an internal error server-side without echoing it to the client. */
export function logServerError(scope: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${scope}] ${message}`);
}
