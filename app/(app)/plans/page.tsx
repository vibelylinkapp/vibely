import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import CreatePlan from "@/components/CreatePlan";
import PlansExplorer, { PlanItem } from "@/components/PlansExplorer";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("county, onboarding_done")
    .eq("id", user.id)
    .single();
  if (!meProfile || !meProfile.onboarding_done) redirect("/onboarding");
  const myCounty = meProfile.county ?? null;

  const nowISO = new Date().toISOString();
  const { data: plansData } = await supabase
    .from("plans")
    .select(
      "id, host_id, title, category, description, county, starts_at, max_people"
    )
    .eq("status", "open")
    .or(`starts_at.is.null,starts_at.gte.${nowISO}`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(60);
  const list = plansData ?? [];

  const planIds = list.map((p) => p.id);
  const hostIds = Array.from(new Set(list.map((p) => p.host_id)));

  let participants: { plan_id: string; profile_id: string }[] = [];
  if (planIds.length) {
    const { data: parts } = await supabase
      .from("plan_participants")
      .select("plan_id, profile_id")
      .in("plan_id", planIds);
    participants = parts ?? [];
  }

  const partProfileIds = Array.from(
    new Set(participants.map((p) => p.profile_id))
  );
  const profileIds = Array.from(new Set([...hostIds, ...partProfileIds]));
  const profMap: Record<
    string,
    { display_name: string; avatar_url: string | null; is_verified: boolean }
  > = {};
  if (profileIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_verified")
      .in("id", profileIds);
    (profs ?? []).forEach((pr) => {
      profMap[pr.id] = {
        display_name: pr.display_name,
        avatar_url: pr.avatar_url,
        is_verified: Boolean(pr.is_verified),
      };
    });
  }

  const countMap: Record<string, number> = {};
  const joinedSet = new Set<string>();
  const goersMap: Record<
    string,
    { id: string; name: string; avatar: string | null }[]
  > = {};
  participants.forEach((pt) => {
    countMap[pt.plan_id] = (countMap[pt.plan_id] ?? 0) + 1;
    if (pt.profile_id === user.id) joinedSet.add(pt.plan_id);
    const pr = profMap[pt.profile_id];
    (goersMap[pt.plan_id] ??= []).push({
      id: pt.profile_id,
      name: pr?.display_name ?? "Member",
      avatar: pr?.avatar_url ?? null,
    });
  });

  const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
  const plans: PlanItem[] = list.map((p) => {
    const host = profMap[p.host_id];
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      county: p.county,
      startsAt: p.starts_at,
      maxPeople: p.max_people,
      hostId: p.host_id,
      hostName: host?.display_name ?? "A member",
      hostAvatar: host?.avatar_url ?? null,
      hostVerified: Boolean(host?.is_verified),
      count: countMap[p.id] ?? 0,
      joined: joinedSet.has(p.id),
      isHost: p.host_id === user.id,
      near: Boolean(myCounty && p.county && norm(p.county) === norm(myCounty)),
      goers: goersMap[p.id] ?? [],
    };
  });

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Plans &amp; meetups</span>
      </div>
      <div className="plan-create-row">
        <CreatePlan />
      </div>
      <PlansExplorer plans={plans} myCounty={myCounty} />
      <BottomNav />
    </main>
  );
}
