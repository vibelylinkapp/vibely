import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import LikeButton from "@/components/LikeButton";
import ProfileActions from "@/components/ProfileActions";
import HighlightsView from "@/components/HighlightsView";
import ProfileFeed from "@/components/ProfileFeed";
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

// 1234 -> "1.2K", 1200000 -> "1.2M". Keeps the stat strip compact.
function compact(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
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

  const nowIso = new Date().toISOString();

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
    { data: theyFollowRaw },
    { data: posts },
    { count: postsCountRaw },
    { data: events },
    { data: stories },
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
    // Did I already like them? Keeps the Like button in its true state.
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
    // Do I follow them? (button state)
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle(),
    // Do they follow me? ("Follows you" pill). Their follow row isn't readable
    // under the counts-only RLS, so use the SECURITY DEFINER edge check.
    supabase.rpc("follows_edge", { a: id, b: user.id }),
    supabase
      .from("posts")
      .select("id, media_url, caption, created_at")
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", id),
    supabase
      .from("events")
      .select(
        "id, title, image_url, category, area, city, starts_at, going_base"
      )
      .eq("created_by", id)
      .eq("status", "published")
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("stories")
      .select("id, media_url, caption, created_at")
      .eq("profile_id", id)
      .eq("is_approved", true)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(30),
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

  const intentLabels = (intents ?? []).map((i) => i.intent as string);
  const chips = intentLabels.slice(0, 4);
  const moreChips = intentLabels.length - chips.length;

  const postList = (posts ?? []).map((p) => ({
    id: p.id,
    url: p.media_url,
    caption: p.caption,
  }));
  const storyList = (stories ?? []).map((s) => ({
    id: s.id,
    url: s.media_url,
    caption: s.caption,
  }));
  const eventList = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    image_url: e.image_url,
    category: e.category,
    place: [e.area, e.city].filter(Boolean).join(", "),
    starts_at: e.starts_at,
    going: e.going_base ?? 0,
  }));

  const followerCount = Number(followerCountRaw ?? 0);
  const followingCount = Number(followingCountRaw ?? 0);
  const postsCount = Number(postsCountRaw ?? postList.length);
  const iFollow = !!myFollow;
  const followsYou = theyFollowRaw === true;
  const joined = profile.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : null;
  const showVerified = !!profile.is_verified;
  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <main className="detail-wrap pf2 pf3">
      {/* Cover banner */}
      <div className="pf3-cover">
        {profile.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pf3-cover-img" src={profile.cover_url} alt="" />
        ) : (
          <div className="pf3-cover-fallback" />
        )}
        <div className="pf3-cover-grad" />
        <Link href="/discover" className="pf3-round pf3-back" aria-label="Back">
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
        <Link
          href="/notifications"
          className="pf3-round pf3-bell"
          aria-label="Notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </Link>
      </div>

      <section className="pf3-head">
        {/* Avatar + stats */}
        <div className="pf3-id-row">
          <div className="pf3-avatar-wrap">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="pf3-avatar"
                src={profile.avatar_url}
                alt={profile.display_name}
              />
            ) : (
              <span className="pf3-avatar pf3-avatar-fallback">{initial}</span>
            )}
            {showVerified && (
              <span className="pf3-shield" aria-label="Verified">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 12.5l3 3 7-7"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            {profile.is_online && (
              <span className="pf3-online-dot" aria-label="Online now" />
            )}
          </div>

          <div className="pf3-stats" aria-label="Profile stats">
            <div className="pf3-stat">
              <b>{compact(postsCount)}</b>
              <span>Posts</span>
            </div>
            <div className="pf3-stat">
              <b>{compact(followerCount)}</b>
              <span>Followers</span>
            </div>
            <div className="pf3-stat">
              <b>{compact(followingCount)}</b>
              <span>Following</span>
            </div>
          </div>
        </div>

        {/* Name + handle */}
        <div className="pf3-name">
          <h1>{profile.display_name}</h1>
          {showVerified && (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Verified">
              <circle cx="12" cy="12" r="12" fill="#7a2ff2" />
              <path
                d="M7 12.5l3 3 7-7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {isVip && <span className="vip-badge">VIP</span>}
        </div>
        <div className="pf3-handle">
          {profile.handle && <span className="pf3-at">@{profile.handle}</span>}
          {followsYou && <span className="pf3-followsyou">Follows you</span>}
        </div>
        {place && (
          <div className="pf3-loc">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>
              {place}
              {age !== null ? ` \u00b7 ${age}` : ""}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pf2-actions pf3-actions">
          <FollowButton
            targetId={profile.id}
            targetName={profile.display_name}
            initialFollowing={iFollow}
          />
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

        {/* Bio + interests */}
        {profile.bio && <p className="pf3-bio">{profile.bio}</p>}
        {chips.length > 0 && (
          <div className="pf3-chips">
            {chips.map((c) => (
              <span className="mini" key={c}>
                {c}
              </span>
            ))}
            {moreChips > 0 && <span className="mini pf3-more">+{moreChips} more</span>}
          </div>
        )}

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="pf2-hl pf3-hl">
            <h3 className="pf2-h">Highlights</h3>
            <HighlightsView highlights={highlights} />
          </div>
        )}

        <ProfileFeed
          posts={postList}
          events={eventList}
          stories={storyList}
          about={{
            name: profile.display_name,
            bio: profile.bio ?? null,
            place,
            age,
            joined,
            isVerified: showVerified,
            isOnline: !!profile.is_online,
            occupation: profile.occupation ?? null,
            education: profile.education ?? null,
            languages: profile.languages ?? null,
          }}
        />
      </section>

      <BottomNav />
    </main>
  );
}
