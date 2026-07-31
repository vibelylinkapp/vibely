import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";
import AvatarUpload from "@/components/AvatarUpload";
import PushSetup from "@/components/PushSetup";
import PrivacyToggles from "@/components/PrivacyToggles";
import GalleryUpload from "@/components/GalleryUpload";
import VerificationSetup from "@/components/VerificationSetup";
import BoostButton from "@/components/BoostButton";
import { effectiveTier, BOOST_QUOTA } from "@/lib/entitlements";

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  const { data: intents } = await supabase
    .from("profile_intents")
    .select("intent")
    .eq("profile_id", user.id);

  const { data: myPhotos } = await supabase
    .from("photos")
    .select("id, url")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const { data: verifReq } = await supabase
    .from("verification_requests")
    .select("status, note")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("tier, status, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  const ent = effectiveTier(subRow);
  const boostQuota = BOOST_QUOTA[ent.tier] ?? 0;
  const boostEligible = boostQuota === null || boostQuota > 0;

  const nowIso = new Date().toISOString();
  const { data: activeBoost } = await supabase
    .from("boosts")
    .select("expires_at")
    .eq("profile_id", user.id)
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let boostRemaining: number | null = null;
  if (boostQuota !== null && boostQuota > 0) {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await supabase
      .from("boosts")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .gte("created_at", since);
    boostRemaining = Math.max(0, boostQuota - (count ?? 0));
  }

  const age = profile.birthdate ? ageFrom(profile.birthdate) : null;
  const place = [profile.area, profile.county].filter(Boolean).join(", ");
  const meta = [age ? String(age) : null, place].filter(Boolean).join(" · ");

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Your profile</span>
      </div>

      <section className="profile-view">
        <AvatarUpload
          userId={user.id}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
        />
        <div className="profile-name-row">
          <h2 className="profile-name">{profile.display_name}</h2>
          {ent.tier === "vip" && <span className="vip-badge">VIP</span>}
        </div>
        {meta && <p className="pcard-meta">{meta}</p>}
        {profile.bio && (
          <p className="sub" style={{ marginTop: 8 }}>
            {profile.bio}
          </p>
        )}
        {intents && intents.length > 0 && (
          <div
            className="pcard-intents"
            style={{ justifyContent: "center", marginTop: 12 }}
          >
            {intents.map((i) => (
              <span className="mini" key={i.intent}>
                {i.intent}
              </span>
            ))}
          </div>
        )}
        <GalleryUpload userId={user.id} initialPhotos={myPhotos ?? []} />
        <VerificationSetup
          userId={user.id}
          verification={profile.verification}
          pending={verifReq?.status === "pending"}
          rejectedNote={
            verifReq?.status === "rejected" ? verifReq.note : null
          }
        />
        <BoostButton
          eligible={boostEligible}
          activeUntil={activeBoost?.expires_at ?? null}
          remaining={boostRemaining}
        />
        {ent.tier === "vip" && (
          <Link href="/top-matches" className="btn vip-link">
            See your VIP top matches
          </Link>
        )}
        <PushSetup />
        <PrivacyToggles
          userId={user.id}
          showLocation={profile.show_location}
          showVerification={profile.show_verification}
        />
        <div className="cta-row" style={{ marginTop: 20, maxWidth: 320 }}>
          <Link href="/upgrade" className="btn-ghost">
            Upgrade
          </Link>
          <Link href="/onboarding" className="btn-ghost">
            Edit profile
          </Link>
          {profile.is_admin && (
            <Link href="/admin" className="btn-ghost">
              Admin panel
            </Link>
          )}
          <SignOutButton />
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
