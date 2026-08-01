import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_PATH } from "@/lib/admin/path";

// Refreshes the auth session cookie on every request so server components see a
// valid user. Also hides the admin panel behind an unguessable base path: the
// real routes live at /admin, but are only reachable via `/${ADMIN_PATH}`.
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const adminBase = `/${ADMIN_PATH}`;

  const isSecretEntry =
    pathname === adminBase || pathname.startsWith(`${adminBase}/`);
  const isDirectAdmin =
    pathname === "/admin" || pathname.startsWith("/admin/");

  // A direct hit to the real path pretends the route does not exist.
  if (isDirectAdmin && !isSecretEntry) {
    return new NextResponse(null, { status: 404 });
  }

  // The unguessable entrance renders the /admin routes without exposing them.
  const rewriteUrl = isSecretEntry
    ? new URL(
        `/admin${pathname.slice(adminBase.length)}${search}`,
        request.url
      )
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
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}
