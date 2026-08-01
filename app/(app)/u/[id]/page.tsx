import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import LikeButton from "@/components/LikeButton";
import ProfileActions from "@/components/ProfileActions";
import HighlightsView from "@/components/HighlightsView";
import { effectiveTier } from "@/lib/entitlements";

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

  // Gallery falls back to the avatar so the page is never empty.
  const gallery =
    photos && photos.length > 0
      ? photos
      : profile.avatar_url
        ? [{ id: "avatar", url: profile.avatar_url }]
        : [];

  return (
    <main className="detail-wrap">
      <header className="detail-head">
        <Link href="/discover" className="thread-back" aria-label="Back">
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
        <span className="detail-head-name">{profile.display_name}</span>
      </header>

      <div className="detail-hero">
        {gallery.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[0].url} alt={profile.display_name} />
        ) : (
          <span className="detail-initial">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
        )}
        {profile.is_online && <span className="detail-online">Online now</span>}
      </div>

      <section className="detail-body">
        <div className="detail-name-row">
          <h1>{profile.display_name}</h1>
          {profile.is_verified && (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Verified">
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
        {meta && <p className="pcard-meta">{meta}</p>}

        {intents && intents.length > 0 && (
          <div className="pcard-intents" style={{ marginTop: 12 }}>
            {intents.map((i) => (
              <span className="mini" key={i.intent}>
                {i.intent}
              </span>
            ))}
          </div>
        )}

        {highlights && highlights.length > 0 && (
          <div className="detail-section">
            <h3>Highlights</h3>
            <HighlightsView highlights={highlights} />
          </div>
        )}

        {profile.bio && (
          <div className="detail-section">
            <h3>About</h3>
            <p>{profile.bio}</p>
          </div>
        )}

        {gallery.length > 1 && (
          <div className="detail-section">
            <h3>Photos</h3>
            <div className="detail-gallery">
              {gallery.slice(1).map((ph) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={ph.id} src={ph.url} alt="" />
              ))}
            </div>
          </div>
        )}

        <div className="detail-actions">
          <LikeButton
            targetId={profile.id}
            targetName={profile.display_name}
            initialLiked={iLiked}
            initialMatched={matched}
          />
          <ProfileActions
            targetId={profile.id}
            targetName={profile.display_name}
          />
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
