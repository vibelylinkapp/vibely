import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Total number of conversations with at least one unread message from the
// other member (mirrors the per-row unread dot on the Messages list).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("profile_id", user.id);
  const convoIds = (memberships ?? []).map((m) => m.conversation_id);
  if (!convoIds.length) return NextResponse.json({ count: 0 });

  const lastReadMap: Record<string, string | null> = {};
  (memberships ?? []).forEach((m) => {
    lastReadMap[m.conversation_id] = m.last_read_at;
  });

  // Newest non-deleted message per conversation.
  const { data: recent } = await supabase
    .from("messages")
    .select("conversation_id, created_at, sender_id")
    .in("conversation_id", convoIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(400);

  const latest: Record<string, { created_at: string; sender_id: string }> = {};
  (recent ?? []).forEach((m) => {
    if (!latest[m.conversation_id]) {
      latest[m.conversation_id] = {
        created_at: m.created_at,
        sender_id: m.sender_id,
      };
    }
  });

  let count = 0;
  for (const cid of convoIds) {
    const last = latest[cid];
    if (!last || last.sender_id === user.id) continue;
    const lr = lastReadMap[cid];
    if (!lr || new Date(last.created_at) > new Date(lr)) count++;
  }
  return NextResponse.json({ count });
}
