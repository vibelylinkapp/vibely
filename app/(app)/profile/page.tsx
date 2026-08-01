import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";
import AvatarUpload from "@/components/AvatarUpload";
import PushSetup from "@/components/PushSetup";
import PrivacyToggles from "@/components/PrivacyToggles";
import GalleryUpload from "@/components/GalleryUpload";
import HighlightsEditor from "@/components/HighlightsEditor";
import VerificationSetup from "@/components/VerificationSetup";
import WhatsAppSetup from "@/components/WhatsAppSetup";
import BoostButton from "@/components/BoostButton";
import ProfileFeed from "@/components/ProfileFeed";
import { effectiveTier, BOOST_QUOTA } from "@/lib/entitlements";
import "@/app/profile-plus.css";

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

  const [{ data: followerCountRaw }, { data: followingCountRaw }] =
    await Promise.all([
      supabase.rpc("follower_count", { uid: user.id }),
      supabase.rpc("following_count", { uid: user.id }),
    ]);

  // Showcase feed data — the member's own posts / events / stories, so /profile
  // previews exactly what the public /u/[id] page shows others.
  const [
    { data: posts },
    { count: postsCountRaw },
    { data: events },
    { data: stories },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, media_url, caption, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id),
    supabase
      .from("events")
      .select(
        "id, title, image_url, category, area, city, starts_at, going_base"
      )
      .eq("created_by", user.id)
      .eq("status", "published")
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("stories")
      .select("id, media_url, caption, created_at")
      .eq("profile_id", user.id)
      .eq("is_approved", true)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

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

  // Per-post like counts for the Posts grid. post_likes is readable by any
  // authenticated member, so a plain tally is enough.
  const postIds = postList.map((p) => p.id);
  const likeCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds);
    for (const r of likeRows ?? []) {
      likeCounts[r.post_id] = (likeCounts[r.post_id] ?? 0) + 1;
    }
  }

  const followerCount = Number(followerCountRaw ?? 0);
  const followingCount = Number(followingCountRaw ?? 0);
  const postsCount = Number(postsCountRaw ?? postList.length);

  const age = profile.birthdate ? ageFrom(profile.birthdate) : null;
  const place = [profile.area, profile.county].filter(Boolean).join(", ");

  const intentLabels = (intents ?? []).map((i) => i.intent as string);
  const chips = intentLabels.slice(0, 4);
  const moreChips = intentLabels.length - chips.length;

  const joined = profile.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : null;
  const showVerified = !!profile.is_verified;
  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <main className="feed-wrap pf2 pf3">
      {/* Cover banner */}
      <div className="pf3-cover">
        {profile.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pf3-cover-img" src={profile.cover_url} alt="" />
        ) : (
          <div className="pf3-cover-fallback" />
        )}
        <div className="pf3-cover-grad" />
        <Link
          href="/onboarding"
          className="pf3-round pf3-edit"
          aria-label="Edit profile"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
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
          {ent.tier === "vip" && <span className="vip-badge">VIP</span>}
        </div>
        {profile.handle && (
          <div className="pf3-handle">
            <span className="pf3-at">@{profile.handle}</span>
          </div>
        )}
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

        {/* Primary action */}
        <div className="pf2-actions pf3-actions">
          <Link href="/onboarding" className="follow-btn pf3-editbtn">
            Edit profile
          </Link>
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
            {moreChips > 0 && (
              <span className="mini pf3-more">+{moreChips} more</span>
            )}
          </div>
        )}

        <ProfileFeed
          posts={postList}
          events={eventList}
          stories={storyList}
          likeCounts={likeCounts}
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

      {/* Manage tools — every editor from the original self profile, preserved */}
      <section className="profile-view pf3-manage">
        <h3 className="pf2-h pf3-manage-h">Manage your profile</h3>
        <AvatarUpload
          userId={user.id}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
        />
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
          <Link href="/onboarding" className="btn-ghost">
            Edit profile
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
