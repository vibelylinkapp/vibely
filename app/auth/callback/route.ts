import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/nav/next-path";

/**
 * Email-confirmation / OAuth redirect: exchanges the one-time code for a
 * session, then forwards to `next`.
 *
 * `next` comes straight from the query string, so it is validated with
 * safeNextPath. Without that, /auth/callback?next=//evil.example would
 * bounce a freshly signed-in member to an attacker's site (open redirect).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next")) ?? "/home";

  if (code && code.length <= 512) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
