import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import LikeButton from "@/components/LikeButton";
import ProfileActions from "@/components/ProfileActions";
import HighlightsView from "@/components/HighlightsView";
import ProfileTabs from "@/components/ProfileTabs";
import FollowButton from "@/components/FollowButton";
import { effectiveTier } from "@/lib/entitlements";
import "@/app/profile-plus.css";

export const dynamic = "force-dynamic";

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Viewing yourself -> your own editable profile.
  if (id === user.id) redirect("/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile || !profile.onboarding_done) notFound();
  // Never expose banned or hidden members to others.
  if (profile.is_banned || profile.is_private) notFound();

  const [
    { data: intents },
    { data: photos },
    { data: sub },
    { data: myLike },
    { data: theirLike },
    { data: highlights },
    { data: followerCountRaw },
    { data: followingCountRaw },
    { data: myFollow },
  ] = await Promise.all([
    supabase.from("profile_intents").select("intent").eq("profile_id", id),
    supabase
      .from("photos")
      .select("id, url")
      .eq("profile_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("tier, status, expires_at")
      .eq("profile_id", id)
      .maybeSingle(),
    // Did I already like them? Keeps the Like button in its true state on reload.
    supabase
      .from("likes")
      .select("liker_id")
      .eq("liker_id", user.id)
      .eq("liked_id", id)
      .maybeSingle(),
    // Did they like me? Both directions true => it's a match.
    supabase
      .from("likes")
      .select("liker_id")
      .eq("liker_id", id)
      .eq("liked_id", user.id)
      .maybeSingle(),
    supabase
      .from("highlights")
      .select("id, title, media_url, caption")
      .eq("profile_id", id)
      .order("position", { ascending: true }),
    supabase.rpc("follower_count", { uid: id }),
    supabase.rpc("following_count", { uid: id }),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle(),
  ]);

  const iLiked = !!myLike;
  const matched = iLiked && !!theirLike;

  const isVip = effectiveTier(sub).tier === "vip";

  // Best-effort: record that this member was viewed.
  await supabase
    .from("profile_views")
    .insert({ viewer_id: user.id, viewed_id: id });

  const age = profile.birthdate ? ageFrom(profile.birthdate) : null;
  const place = [profile.area, profile.county].filter(Boolean).join(", ");
  const meta = [age ? String(age) : null, place].filter(Boolean).join(" · ");

  // Gallery falls back to the avatar so the hero is never empty.
  const gallery =
    photos && photos.length > 0
      ? photos
      : profile.avatar_url
        ? [{ id: "avatar", url: profile.avatar_url }]
        : [];

  const intentLabels = (intents ?? []).map((i) => i.intent as string);
  const photoList = (photos ?? []).map((p) => ({ id: p.id, url: p.url }));
  const photosCount = photoList.length;
  const followerCount = Number(followerCountRaw ?? 0);
  const followingCount = Number(followingCountRaw ?? 0);
  const iFollow = !!myFollow;
  const joined = profile.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : null;
  const showVerified = !!profile.is_verified;

  return (
    <main className="detail-wrap pf2">
      <div className="pf2-hero">
        {gallery.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pf2-hero-img"
            src={gallery[0].url}
            alt={profile.display_name}
          />
        ) : (
          <span className="pf2-hero-initial">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
        )}

        <Link href="/discover" className="pf2-back" aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {profile.is_online && <span className="pf2-online">Online now</span>}

        <div className="pf2-hero-grad" />
        <div className="pf2-hero-info">
          <div className="pf2-hero-name">
            <h1>{profile.display_name}</h1>
            {showVerified && (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-label="Verified"
              >
                <circle cx="12" cy="12" r="12" fill="#FFB020" />
                <path
                  d="M7 12.5l3 3 7-7"
                  fill="none"
                  stroke="#12151D"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {isVip && <span className="vip-badge">VIP</span>}
          </div>
          {meta && <p className="pf2-hero-meta">{meta}</p>}
        </div>
      </div>

      <section className="pf2-body">
        <div className="follow-stats">
          <div className="follow-stat">
            <b>{followerCount}</b>
            <span>Followers</span>
          </div>
          <div className="follow-stat">
            <b>{followingCount}</b>
            <span>Following</span>
          </div>
          <div className="follow-stat">
            <b>{photosCount}</b>
            <span>Photos</span>
          </div>
        </div>

        <div className="pf2-actions">
          <LikeButton
            targetId={profile.id}
            targetName={profile.display_name}
            initialLiked={iLiked}
            initialMatched={matched}
          />
          <FollowButton
            targetId={profile.id}
            targetName={profile.display_name}
            initialFollowing={iFollow}
          />
          <ProfileActions
            targetId={profile.id}
            targetName={profile.display_name}
          />
        </div>

        {highlights && highlights.length > 0 && (
          <div className="pf2-hl">
            <h3 className="pf2-h">Highlights</h3>
            <HighlightsView highlights={highlights} />
          </div>
        )}

        <ProfileTabs
          photos={photoList}
          intents={intentLabels}
          bio={profile.bio ?? null}
          name={profile.display_name}
          place={place}
          joined={joined}
          isVerified={showVerified}
          isOnline={!!profile.is_online}
          age={age}
        />
      </section>

      <BottomNav />
    </main>
  );
}
