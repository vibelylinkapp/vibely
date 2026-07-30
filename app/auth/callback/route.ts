import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the email-confirmation / OAuth redirect: exchanges the code for a session.
// Defaults to /home, which itself bounces new users to /onboarding when their
// profile isn't complete yet — so returning Google users land straight on Home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
