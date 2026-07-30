import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import CreatePlan from "@/components/CreatePlan";
import JoinPlanButton from "@/components/JoinPlanButton";

export const dynamic = "force-dynamic";

function fmt(dt: string | null): string {
  if (!dt) return "Flexible timing";
  return new Date(dt).toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const nowISO = new Date().toISOString();
  const { data: plansData } = await supabase
    .from("plans")
    .select(
      "id, host_id, title, category, description, county, starts_at, max_people"
    )
    .eq("status", "open")
    .or(`starts_at.is.null,starts_at.gte.${nowISO}`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(50);

  const list = plansData ?? [];
  const planIds = list.map((p) => p.id);
  const hostIds = Array.from(new Set(list.map((p) => p.host_id)));

  const hostMap: Record<string, string> = {};
  if (hostIds.length) {
    const { data: hosts } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", hostIds);
    (hosts ?? []).forEach((h) => {
      hostMap[h.id] = h.display_name;
    });
  }

  const countMap: Record<string, number> = {};
  const joinedSet = new Set<string>();
  if (planIds.length) {
    const { data: parts } = await supabase
      .from("plan_participants")
      .select("plan_id, profile_id")
      .in("plan_id", planIds);
    (parts ?? []).forEach((pt) => {
      countMap[pt.plan_id] = (countMap[pt.plan_id] ?? 0) + 1;
      if (pt.profile_id === user.id) joinedSet.add(pt.plan_id);
    });
  }

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Plans & meetups</span>
        <Link href="/home" className="pcard-meta" style={{ textDecoration: "none" }}>
          Home
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <CreatePlan />
      </div>

      {list.length === 0 ? (
        <p className="sub" style={{ textAlign: "center", marginTop: 30 }}>
          No plans yet. Create the first one and invite people to join you.
        </p>
      ) : (
        <div className="plan-list">
          {list.map((p) => {
            const count = countMap[p.id] ?? 0;
            const full = p.max_people != null && count >= p.max_people;
            return (
              <div key={p.id} className="plan-card">
                <div className="plan-top">
                  <span className="plan-cat">{p.category}</span>
                  <span className="plan-count">
                    {count} going{p.max_people ? ` / ${p.max_people}` : ""}
                  </span>
                </div>
                <div className="plan-title">{p.title}</div>
                <div className="plan-meta">
                  {fmt(p.starts_at)}
                  {p.county ? ` · ${p.county}` : ""}
                </div>
                {p.description && <p className="plan-desc">{p.description}</p>}
                <div className="plan-foot">
                  <span className="plan-host">
                    Hosted by {hostMap[p.host_id] ?? "a member"}
                  </span>
                  <JoinPlanButton
                    planId={p.id}
                    isHost={p.host_id === user.id}
                    joined={joinedSet.has(p.id)}
                    full={full}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
