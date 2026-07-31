import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import JoinPlanButton from "@/components/JoinPlanButton";

export const dynamic = "force-dynamic";

function fmt(dt: string | null): string {
  if (!dt) return "Flexible timing";
  return new Date(dt).toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PlanDetailPage({
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

  const { data: plan } = await supabase
    .from("plans")
    .select(
      "id, host_id, title, category, description, county, starts_at, max_people, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (!plan) notFound();

  const { data: parts } = await supabase
    .from("plan_participants")
    .select("profile_id")
    .eq("plan_id", id);
  const partIds = (parts ?? []).map((p) => p.profile_id);
  const count = partIds.length;
  const joined = partIds.includes(user.id);
  const isHost = plan.host_id === user.id;
  const full = typeof plan.max_people === "number" && count >= plan.max_people;

  const profileIds = Array.from(new Set([plan.host_id, ...partIds]));
  const profileMap: Record<
    string,
    { id: string; display_name: string; avatar_url: string | null }
  > = {};
  if (profileIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", profileIds);
    (profs ?? []).forEach((pr) => {
      profileMap[pr.id] = pr;
    });
  }
  const host = profileMap[plan.host_id];
  const goers = partIds
    .map((pid) => profileMap[pid])
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const place = plan.county ?? "Flexible location";

  return (
    <main className="event-wrap">
      <header className="event-head">
        <Link href="/plans" className="thread-back" aria-label="Back to plans">
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
        <span className="event-head-title">Plan details</span>
      </header>

      <div className="event-hero">
        <span className="event-hero-cat">{plan.category}</span>
        <h1 className="event-hero-title">{plan.title}</h1>
        <span className="event-hero-when">{fmt(plan.starts_at)}</span>
      </div>

      <section className="event-body">
        <div className="event-stats">
          <div className="event-stat">
            <span className="event-stat-k">Where</span>
            <span className="event-stat-v">{place}</span>
          </div>
          <div className="event-stat">
            <span className="event-stat-k">Going</span>
            <span className="event-stat-v">
              {count}
              {typeof plan.max_people === "number"
                ? ` / ${plan.max_people}`
                : ""}
            </span>
          </div>
          <div className="event-stat">
            <span className="event-stat-k">Status</span>
            <span className="event-stat-v">
              {plan.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        {host && (
          <div className="event-host">
            <span className="event-host-av">
              {host.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={host.avatar_url} alt={host.display_name} />
              ) : (
                host.display_name.charAt(0).toUpperCase()
              )}
            </span>
            <div>
              <div className="event-host-k">Hosted by</div>
              <div className="event-host-n">{host.display_name}</div>
            </div>
          </div>
        )}

        {plan.description && (
          <div className="detail-section">
            <h3>About this plan</h3>
            <p>{plan.description}</p>
          </div>
        )}

        {goers.length > 0 && (
          <div className="detail-section">
            <h3>Who&apos;s going</h3>
            <div className="event-going">
              {goers.map((g) => (
                <Link key={g.id} href={`/u/${g.id}`} className="event-goer">
                  <span className="event-goer-av">
                    {g.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.avatar_url} alt={g.display_name} />
                    ) : (
                      g.display_name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="event-goer-n">
                    {g.display_name.split(" ")[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="event-cta">
          <JoinPlanButton
            planId={plan.id}
            isHost={isHost}
            joined={joined}
            full={full}
          />
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
