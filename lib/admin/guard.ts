import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Ensures the current user is a signed-in admin. Redirects otherwise.
// Admin access is granted by EITHER the profiles.is_admin flag OR an email in
// the ADMIN_EMAILS env allowlist (comma-separated) — so more admins can be
// added without a database change.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const emailAllowed = user.email
    ? allowlist.includes(user.email.toLowerCase())
    : false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", user.id)
    .single();

  if (!emailAllowed && (!profile || !profile.is_admin)) redirect("/home");
  return { userId: user.id, name: profile?.display_name ?? "Admin" };
}
