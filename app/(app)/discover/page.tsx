import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import BottomNav from "@/components/BottomNav";
import type { Database } from "@/lib/database.types";

type Intent = Database["public"]["Enums"]["intent_t"];

const FILTERS: { id: Intent | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "dating", label: "Dating" },
  { id: "friendship", label: "Friends" },
  { id: "hangout", label: "Hangout" },
  { id: "networking", label: "Networking" },
  { id: "gym", label: "Gym" },
  { id: "coffee", label: "Coffee" },
  { id: "travel", label: "Travel" },
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const sp = await searchParams;
  const active = sp.intent ?? "all";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: blockedRows } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  const blockedIds = (blockedRows ?? []).map((b) => b.blocked_id);

  let matchIds: string[] | null = null;
  if (active !== "all") {
    const { data: pi } = await supabase
      .from("profile_intents")
      .select("profile_id")
      .eq("intent", active as Intent);
    matchIds = (pi ?? []).map((r) => r.profile_id);
  }

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, county, area, birthdate, is_online, is_verified"
    )
    .eq("onboarding_done", true)
    .eq("is_private", false)
    .eq("invisible_mode", false)
    .neq("id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(60);

  if (matchIds) {
    query = query.in(
      "id",
      matchIds.length ? matchIds : ["00000000-0000-0000-0000-000000000000"]
    );
  }

  const { data: profilesData } = await query;
  const profiles = (profilesData ?? []).filter(
    (p) => !blockedIds.includes(p.id)
  );

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

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Discover</span>
        <Link href="/home" className="pcard-meta" style={{ textDecoration: "none" }}>
          Home
        </Link>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/discover" : `/discover?intent=${f.id}`}
            className={"chip" + (active === f.id ? " chip-on" : "")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {profiles.length === 0 ? (
        <p className="sub" style={{ textAlign: "center", marginTop: 40 }}>
          No one here yet. As more people join Vibely, they will show up here.
          Invite a friend to sign up and watch this fill in.
        </p>
      ) : (
        <div className="grid">
          {profiles.map((p) => (
            <ProfileCard key={p.id} p={p} intents={intentMap[p.id] ?? []} />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
