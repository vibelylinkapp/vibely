import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PATH } from "@/lib/admin/path";

/**
 * Ensures the current user is a signed-in admin. Redirects otherwise.
 *
 * Admin is granted by `profiles.is_admin` and nothing else.
 *
 * There used to be a second grant: any address listed in an ADMIN_EMAILS
 * environment allowlist. It was removed because it was an escalation path
 * dressed as a convenience.
 *
 * /api/auth/signup is unauthenticated, uses the service role, and passes
 * `email_confirm: true` -- so it hands out a CONFIRMED account to anyone who
 * types an address, with nothing proving they own it. Any allowlisted address
 * that did not already have an account could therefore be claimed by a
 * stranger, who would then hold full admin, and app/admin/actions.ts reaches
 * for the service role in twelve places.
 *
 * It was also half-wired. The server actions gate on `profiles.is_admin`
 * alone, so an allowlist-only admin could read every admin page while every
 * action they attempted threw "Forbidden".
 *
 * To add an admin, set `profiles.is_admin = true` on their row. That is a
 * deliberate act against a real account, which is the point.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Carry the panel path through sign-in so an admin lands in the dashboard
  // rather than on /home needing to retype an unguessable URL.
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/${ADMIN_PATH}`)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) redirect("/home");
  return { userId: user.id, name: profile.display_name ?? "Admin" };
}
