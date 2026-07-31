import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import ProfileCard from "@/components/ProfileCard";
import WhatsAppShare from "@/components/WhatsAppShare";

export const dynamic = "force-dynamic";

const NONE = "00000000-0000-0000-0000-000000000000";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // A match = we liked each other. Read both directions (likes RLS lets me see
  // edges I'm part of), then intersect.
  const [{ data: iLiked }, { data: likedMe }, { data: blocks }] =
    await Promise.all([
      supabase.from("likes").select("liked_id").eq("liker_id", user.id),
      supabase.from("likes").select("liker_id").eq("liked_id", user.id),
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    ]);
  const likedSet = new Set((iLiked ?? []).map((r) => r.liked_id));
  const blockedSet = new Set((blocks ?? []).map((b) => b.blocked_id));
  const matchIds = Array.from(
    new Set((likedMe ?? []).map((r) => r.liker_id))
  ).filter((id) => likedSet.has(id) && !blockedSet.has(id));

  const { data: profilesData } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified"
    )
    .in("id", matchIds.length ? matchIds : [NONE])
    .eq("is_private", false)
    .eq("is_banned", false);
  const profiles = profilesData ?? [];
  const ids = profiles.map((p) => p.id);

  const intentMap: Record<string, string[]> = {};
  if (ids.length) {
    const { data: allIntents } = await supabase
      .from("profile_intents")
      .select("profile_id, intent")
      .in("profile_id", ids);
    (allIntents ?? []).forEach((r) => {
      (intentMap[r.profile_id] ??= []).push(r.intent);
    });
  }

  const vipSet = new Set<string>();
  if (ids.length) {
    const nowIso = new Date().toISOString();
    const { data: vipRows } = await supabase
      .from("subscriptions")
      .select("profile_id")
      .in("profile_id", ids)
      .eq("tier", "vip")
      .eq("status", "active")
      .gt("expires_at", nowIso);
    (vipRows ?? []).forEach((r) => vipSet.add(r.profile_id));
  }

  // WhatsApp-sharing state per match, in both request directions.
  type ReqStatus = "none" | "pending" | "approved" | "declined";
  const [{ data: outReq }, { data: inReq }] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("target_id, status")
      .eq("requester_id", user.id),
    supabase
      .from("contact_requests")
      .select("requester_id, status")
      .eq("target_id", user.id),
  ]);
  const outMap = new Map<string, ReqStatus>(
    (outReq ?? []).map((r) => [r.target_id, r.status as ReqStatus])
  );
  const inMap = new Map<string, ReqStatus>(
    (inReq ?? []).map((r) => [r.requester_id, r.status as ReqStatus])
  );

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Your matches</span>
      </div>

      {profiles.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-t">No matches yet</p>
          <p className="sub">
            When you and someone else both like each other, they show up here —
            and you can start chatting right away.
          </p>
          <div className="cta-row" style={{ maxWidth: 320, margin: "16px auto 0" }}>
            <Link href="/discover" className="btn">
              Discover people
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="matches-sub">
            You matched with {profiles.length}{" "}
            {profiles.length === 1 ? "person" : "people"}. Say hello.
          </p>
          <div className="grid">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                p={p}
                intents={intentMap[p.id] ?? []}
                vip={vipSet.has(p.id)}
                matched
                contactShare={
                  <WhatsAppShare
                    otherId={p.id}
                    otherName={p.display_name}
                    outgoing={outMap.get(p.id) ?? "none"}
                    incoming={inMap.get(p.id) ?? "none"}
                  />
                }
              />
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
