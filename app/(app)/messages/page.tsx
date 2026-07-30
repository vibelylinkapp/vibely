import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import MatchRow from "@/components/MatchRow";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("profile_id", user.id);
  const convoIds = (myMemberships ?? []).map((m) => m.conversation_id);
  const lastReadMap: Record<string, string | null> = {};
  (myMemberships ?? []).forEach((m) => {
    lastReadMap[m.conversation_id] = m.last_read_at;
  });

  // Matches = mutual likes (excluding anyone I've blocked).
  const [{ data: outLikes }, { data: inLikes }, { data: myBlocks }] =
    await Promise.all([
      supabase.from("likes").select("liked_id").eq("liker_id", user.id),
      supabase.from("likes").select("liker_id").eq("liked_id", user.id),
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    ]);
  const likedSet = new Set((outLikes ?? []).map((l) => l.liked_id));
  const blockedSet = new Set((myBlocks ?? []).map((b) => b.blocked_id));
  const matchedIds = Array.from(
    new Set((inLikes ?? []).map((l) => l.liker_id))
  ).filter((id) => likedSet.has(id) && !blockedSet.has(id));

  let convos: { id: string; last_msg_at: string | null; created_at: string }[] =
    [];
  const otherIdByConvo: Record<string, string> = {};
  const otherIds: string[] = [];
  const profileMap: Record<
    string,
    { display_name: string; avatar_url: string | null; is_online: boolean }
  > = {};
  const lastMsgMap: Record<
    string,
    { body: string | null; created_at: string; sender_id: string }
  > = {};

  if (convoIds.length) {
    const { data: convoRows } = await supabase
      .from("conversations")
      .select("id, last_msg_at, created_at")
      .in("id", convoIds)
      .order("last_msg_at", { ascending: false, nullsFirst: false });
    convos = convoRows ?? [];

    const { data: otherMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, profile_id")
      .in("conversation_id", convoIds)
      .neq("profile_id", user.id);
    (otherMembers ?? []).forEach((m) => {
      otherIdByConvo[m.conversation_id] = m.profile_id;
      otherIds.push(m.profile_id);
    });

    if (otherIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_online")
        .in("id", otherIds);
      (profs ?? []).forEach((p) => {
        profileMap[p.id] = {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          is_online: p.is_online,
        };
      });
    }

    const { data: recentMsgs } = await supabase
      .from("messages")
      .select("conversation_id, body, created_at, sender_id")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false })
      .limit(300);
    (recentMsgs ?? []).forEach((m) => {
      if (!lastMsgMap[m.conversation_id]) {
        lastMsgMap[m.conversation_id] = {
          body: m.body,
          created_at: m.created_at,
          sender_id: m.sender_id,
        };
      }
    });
  }

  // New matches = matched people I don't yet have a conversation with.
  const convoOtherIds = new Set(Object.values(otherIdByConvo));
  const newMatchIds = matchedIds.filter((id) => !convoOtherIds.has(id));
  let newMatches: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  }[] = [];
  if (newMatchIds.length) {
    const { data: mProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", newMatchIds);
    newMatches = mProfiles ?? [];
  }

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Messages</span>
      </div>

      <MatchRow matches={newMatches} />

      {convos.length > 0 ? (
        <div className="convo-list">
          {convos.map((c) => {
            const otherId = otherIdByConvo[c.id];
            const other = otherId ? profileMap[otherId] : undefined;
            const last = lastMsgMap[c.id];
            const lastRead = lastReadMap[c.id];
            const unread =
              !!last &&
              last.sender_id !== user.id &&
              (!lastRead || new Date(last.created_at) > new Date(lastRead));
            const name = other?.display_name ?? "Vibely member";
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="convo-row">
                <div className="convo-avatar">
                  {other?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.avatar_url} alt={name} />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                  {other?.is_online && <span className="convo-dot" />}
                </div>
                <div className="convo-body">
                  <div className="convo-name">{name}</div>
                  <div className={"convo-preview" + (unread ? " unread" : "")}>
                    {last
                      ? last.sender_id === user.id
                        ? `You: ${last.body ?? ""}`
                        : last.body ?? ""
                      : "No messages yet"}
                  </div>
                </div>
                {unread && <span className="convo-unread" />}
              </Link>
            );
          })}
        </div>
      ) : (
        <p
          className="sub"
          style={{ textAlign: "center", marginTop: newMatches.length ? 20 : 40 }}
        >
          {newMatches.length
            ? "Tap a match above to say hi and start chatting."
            : "No conversations yet. Head to Discover and like people — when someone likes you back, you can message them here."}
        </p>
      )}

      <BottomNav />
    </main>
  );
}
