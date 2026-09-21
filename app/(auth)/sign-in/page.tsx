import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/nav/next-path";
import SignInForm from "./sign-in-form";

// Server guard: if the visitor already has a valid session, never show the
// login form - send them straight on. This is what keeps people "logged in"
// when they refresh or hit the browser back button after signing in (the
// middleware refreshes the session cookie on every request; this page just
// makes sure an authenticated user is redirected instead of seeing the
// sign-in screen again). /home itself forwards to /onboarding when needed.
//
// The `next` parameter is what makes the admin panel reachable in one hop.
// requireAdmin() sends a signed-out admin here with ?next=/<admin path>, so
// after signing in they land in the panel instead of arriving on /home and
// having to remember an unguessable URL. Validated by safeNextPath, because
// a raw query value reaching redirect() is an open-redirect hole.
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = safeNextPath(next) ?? "/home";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(target);

  return <SignInForm next={target} />;
}
