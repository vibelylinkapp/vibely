import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";
import AvatarUpload from "@/components/AvatarUpload";
import CoverPhoto from "@/components/CoverPhoto";
import ProfileInfoForm from "@/components/ProfileInfoForm";
import PushSetup from "@/components/PushSetup";
import PrivacyToggles from "@/components/PrivacyToggles";
import GalleryUpload from "@/components/GalleryUpload";
import HighlightsEditor from "@/components/HighlightsEditor";
import VerificationSetup from "@/components/VerificationSetup";
import WhatsAppSetup from "@/components/WhatsAppSetup";
import BoostButton from "@/components/BoostButton";
import { effectiveTier, BOOST_QUOTA } from "@/lib/entitlements";
import "@/app/profile-plus.css";

// One-stop edit hub: everything that shapes the profile lives here so the
// public /profile view stays clean. Basic info is edited inline (no bounce to
// onboarding); cover + avatar + highlights + gallery + contact + verification
// + settings all follow.
export default async function ProfileEditPage() {
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

  const { data: intentRows } = await supabase
    .from("profile_intents")
    .select("intent")
    .eq("profile_id", user.id);

  const { data: myPhotos } = await supabase
    .from("photos")
    .select("id, url")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const { data: myHighlights } = await supabase
    .from("highlights")
    .select("id, title, media_url, caption")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const { data: verifReq } = await supabase
    .from("verification_requests")
    .select("status, note")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: myContact } = await supabase
    .from("member_contacts")
    .select("whatsapp")
    .eq("profile_id", user.id)
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

  const infoInitial = {
    displayName: profile.display_name ?? "",
    handle: profile.handle ?? "",
    birthdate: profile.birthdate ?? "",
    gender: profile.gender ?? "",
    county: profile.county ?? "Nairobi",
    area: profile.area ?? "",
    bio: profile.bio ?? "",
    occupation: profile.occupation ?? "",
    education: profile.education ?? "",
    languages: Array.isArray(profile.languages)
      ? profile.languages.join(", ")
      : "",
    intents: (intentRows ?? []).map((i) => i.intent),
  };

  return (
    <main className="feed-wrap pf2 pf3 pf4">
      <div className="pf4-edit-top">
        <Link href="/profile" className="pf4-edit-back" aria-label="Back to profile">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="pf4-edit-title">Edit profile</h1>
      </div>

      <section className="profile-view pf4-edit">
        {/* Your information — edited inline, saved in place */}
        <div className="pf4-editcard">
          <h4 className="pf4-card-h">Your information</h4>
          <ProfileInfoForm userId={user.id} initial={infoInitial} />
        </div>

        {/* Cover photo — editable here too */}
        <div className="pf4-edit-sec">
          <h4 className="pf4-card-h">Cover photo</h4>
          <div className="pf3-cover pf4-cover-inline">
            <CoverPhoto userId={user.id} coverUrl={profile.cover_url} />
          </div>
        </div>

        {/* Profile photo */}
        <div className="pf4-edit-sec pf4-edit-sec-center">
          <h4 className="pf4-card-h">Profile photo</h4>
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
          />
        </div>

        <HighlightsEditor
          userId={user.id}
          initialHighlights={myHighlights ?? []}
        />
        <GalleryUpload userId={user.id} initialPhotos={myPhotos ?? []} />
        <WhatsAppSetup userId={user.id} initial={myContact?.whatsapp ?? null} />
        <VerificationSetup
          userId={user.id}
          verification={profile.verification}
          pending={verifReq?.status === "pending"}
          rejectedNote={verifReq?.status === "rejected" ? verifReq.note : null}
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
          <Link href="/feedback" className="btn-ghost">
            Send feedback
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
