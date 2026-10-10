import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_PATH } from "@/lib/admin/path";

/**
 * Runs on every matched request:
 *  - refreshes the Supabase auth cookie so server components see a valid user;
 *  - enforces an idle-session timeout (SESSION_IDLE_DAYS, default 30);
 *  - hides the admin panel behind an unguessable base path: the real routes
 *    live at /admin but are only reachable via `/${ADMIN_PATH}`.
 */
const ACTIVITY_COOKIE = "vb_last_seen";
const IDLE_DAYS = Math.max(1, Number(process.env.SESSION_IDLE_DAYS ?? "30") || 30);
const IDLE_MS = IDLE_DAYS * 24 * 60 * 60 * 1000;

/** Hardened defaults for every auth cookie Supabase writes. */
function hardened(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    path: options.path ?? "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const adminBase = `/${ADMIN_PATH}`;

  const isSecretEntry =
    pathname === adminBase || pathname.startsWith(`${adminBase}/`);
  const isDirectAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // A direct hit to the real path pretends the route does not exist.
  if (isDirectAdmin && !isSecretEntry) {
    return new NextResponse(null, { status: 404 });
  }

  const rewriteUrl = isSecretEntry
    ? new URL(`/admin${pathname.slice(adminBase.length)}${search}`, request.url)
    : null;

  const build = () =>
    rewriteUrl
      ? NextResponse.rewrite(rewriteUrl, { request })
      : NextResponse.next({ request });

  let supabaseResponse = build();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = build();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, hardened(options))
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Idle-session expiry: a session untouched for IDLE_DAYS is signed out,
    // which limits the value of a stolen-but-unused cookie.
    const lastSeen = Number(request.cookies.get(ACTIVITY_COOKIE)?.value ?? "0");
    const now = Date.now();
    if (lastSeen > 0 && now - lastSeen > IDLE_MS) {
      await supabase.auth.signOut();
      const isApi = pathname.startsWith("/api/");
      const res = isApi
        ? NextResponse.json({ ok: false, error: "session_expired" }, { status: 401 })
        : NextResponse.redirect(new URL("/sign-in", request.url));
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
      res.cookies.delete(ACTIVITY_COOKIE);
      return res;
    }
    // Refresh the activity stamp at most once a minute.
    if (now - lastSeen > 60_000) {
      supabaseResponse.cookies.set(ACTIVITY_COOKIE, String(now), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: IDLE_DAYS * 24 * 60 * 60,
      });
    }
  }

  return supabaseResponse;
}
