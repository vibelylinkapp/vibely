import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Ensures the current user is a signed-in admin. Redirects otherwise.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) redirect("/home");
  return { userId: user.id, name: profile.display_name };
}
