import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
      <div className="disc-tabs">
        <Link href="/nearby" className="disc-tab on">
          People nearby
        </Link>
        <Link href="/heatmap" className="disc-tab">
          Live heatmap
        </Link>
      </div>
      <NearbyExplorer meId={user.id} />
    </main>
  );
}
