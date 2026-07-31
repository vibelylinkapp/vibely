import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import Heatmap from "@/components/Heatmap";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
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
        <span className="feed-title">Heatmap</span>
      </div>
      <div className="disc-tabs">
        <Link href="/nearby" className="disc-tab">
          People nearby
        </Link>
        <Link href="/heatmap" className="disc-tab on">
          Live heatmap
        </Link>
      </div>
      <Heatmap />
      <BottomNav />
    </main>
  );
}
