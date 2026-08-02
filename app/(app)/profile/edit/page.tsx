import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AvatarUpload from "@/components/AvatarUpload";
import CoverPhoto from "@/components/CoverPhoto";
import ProfileInfoForm from "@/components/ProfileInfoForm";
import GalleryUpload from "@/components/GalleryUpload";
import HighlightsEditor from "@/components/HighlightsEditor";
import "@/app/profile-plus.css";

// Edit hub for the CONTENT of your profile: information, cover, photo,
// highlights and gallery. Account & settings (WhatsApp, verification, boost,
// notifications, privacy, upgrade, feedback, sign out) now live on the /profile
// page, below your posts.
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
        {/* Your information \u2014 edited inline, saved in place */}
        <div className="pf4-editcard">
          <h4 className="pf4-card-h">Your information</h4>
          <ProfileInfoForm userId={user.id} initial={infoInitial} />
        </div>

        {/* Cover photo \u2014 editable here too */}
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
      </section>

      <BottomNav />
    </main>
  );
}
