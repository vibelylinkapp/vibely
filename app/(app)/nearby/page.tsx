import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import NearbyExplorer from "@/components/NearbyExplorer";

export const dynamic = "force-dynamic";

export default async function NearbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_done")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Nearby</span>
      </div>
      <NearbyExplorer meId={user.id} />
      <BottomNav />
    </main>
  );
}
