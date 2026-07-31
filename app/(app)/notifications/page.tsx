import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import NotificationsView, { NotifRow } from "@/components/NotificationsView";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: notifs } = await supabase
    .from("notifications")
    .select(
      "id, type, entity_type, entity_id, link, body, read_at, created_at, actor_id"
    )
    .order("created_at", { ascending: false })
    .limit(80);

  const list = notifs ?? [];
  const actorIds = Array.from(
    new Set(list.map((n) => n.actor_id).filter(Boolean))
  ) as string[];

  const actors: Record<
    string,
    { display_name: string | null; avatar_url: string | null }
  > = {};
  if (actorIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);
    (profs ?? []).forEach((p) => {
      actors[p.id] = {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      };
    });
  }

  const rows: NotifRow[] = list.map((n) => ({
    id: n.id,
    type: n.type,
    entity_type: n.entity_type,
    entity_id: n.entity_id,
    link: n.link,
    body: n.body,
    read_at: n.read_at,
    created_at: n.created_at,
    actor: n.actor_id ? actors[n.actor_id] ?? null : null,
  }));

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Notifications</span>
      </div>
      <NotificationsView initial={rows} />
      <BottomNav />
    </main>
  );
}
