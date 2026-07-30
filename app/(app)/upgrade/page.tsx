import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import UpgradeTiers from "@/components/UpgradeTiers";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Upgrade</span>
      </div>
      <p className="upgrade-lead">
        Unlock more of Vibely and get seen by more people across Kenya.
      </p>
      <UpgradeTiers
        currentTier={sub?.tier ?? "free"}
        currentStatus={sub?.status ?? "active"}
        expiresAt={sub?.expires_at ?? null}
      />
      <BottomNav />
    </main>
  );
}
