import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hit, ruleFor } from "@/lib/security/rate-limit-edge";

/**
 * Edge middleware - the first line of defence for every request.
 *
 * 1. HTTPS everywhere: any plain-http request is permanently redirected.
 * 2. Rate limiting: per-IP budgets on every /api route (see rate-limit-edge).
 * 3. CSRF: state-changing /api requests must come from our own origin.
 *    Supabase auth cookies are SameSite=Lax, and this Origin check closes the
 *    remaining gap. The M-Pesa webhook is exempt (Safaricom has no Origin)
 *    and is authenticated by its own shared secret instead.
 * 4. Session refresh + idle expiry + admin path rewrite (lib/supabase/middleware).
 */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT = ["/api/mpesa/callback"];

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) {
    // Browsers always send Origin on cross-site POSTs, so a missing header
    // means a same-origin navigation or a non-browser client. Fall back to
    // Sec-Fetch-Site when it is present.
    const site = req.headers.get("sec-fetch-site");
    return !site || site === "same-origin" || site === "none";
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. HTTPS everywhere (Vercel terminates TLS and sets x-forwarded-proto).
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/")) {
    // 2. Rate limiting.
    const rule = ruleFor(pathname);
    if (rule) {
      const retryAfter = hit(`${clientIp(request)}:${pathname}`, rule);
      if (retryAfter > 0) {
        return NextResponse.json(
          { ok: false, error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // 3. CSRF origin check.
    if (
      UNSAFE_METHODS.has(request.method) &&
      !CSRF_EXEMPT.some((p) => pathname.startsWith(p)) &&
      !sameOrigin(request)
    ) {
      return NextResponse.json(
        { ok: false, error: "Cross-site request blocked." },
        { status: 403 }
      );
    }
  }

  // 4. Session handling.
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|landing|seed|fonts|manifest.json|robots.txt|sitemap.xml|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
