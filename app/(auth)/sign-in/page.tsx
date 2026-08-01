import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";

// Server guard: if the visitor already has a valid session, never show the
// login form — send them straight into the app. This is what keeps people
// "logged in" when they refresh or hit the browser back button after signing
// in (the middleware refreshes the session cookie on every request; this page
// just makes sure an authenticated user is redirected instead of seeing the
// sign-in screen again). /home itself forwards to /onboarding when needed.
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return <SignInForm />;
}
