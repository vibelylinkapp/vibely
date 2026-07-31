"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import JoinPlanButton from "@/components/JoinPlanButton";

export type PlanItem = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  county: string | null;
  startsAt: string | null;
  maxPeople: number | null;
  hostId: string;
  hostName: string;
  hostAvatar: string | null;
  hostVerified: boolean;
  count: number;
  joined: boolean;
  isHost: boolean;
  near: boolean;
  goers: { id: string; name: string; avatar: string | null }[];
};

function whenPill(iso: string | null): string {
  if (!iso) return "Flexible timing";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }) +
    " \u00b7 " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PlansExplorer({
  plans,
  myCounty,
}: {
  plans: PlanItem[];
  myCounty: string | null;
}) {
  const [scope, setScope] = useState<"near" | "all">(() =>
    myCounty && plans.some((p) => p.near) ? "near" : "all"
  );
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const cats = useMemo(() => {
    const s = new Set<string>();
    plans.forEach((p) => {
      if (p.category) s.add(p.category);
    });
    return ["All", ...Array.from(s).sort()];
  }, [plans]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return plans.filter((p) => {
      if (scope === "near" && !p.near) return false;
      if (cat !== "All" && p.category !== cat) return false;
      if (term) {
        const hay = `${p.title} ${p.description ?? ""} ${p.hostName} ${
          p.county ?? ""
        }`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [plans, scope, cat, q]);

  return (
    <div className="plan-explorer">
      <div className="plan-scope">
        {myCounty && (
          <button
            type="button"
            className={"nb-chip" + (scope === "near" ? " on" : "")}
            onClick={() => setScope("near")}
          >
            Near me &middot; {myCounty}
          </button>
        )}
        <button
          type="button"
          className={"nb-chip" + (scope === "all" ? " on" : "")}
          onClick={() => setScope("all")}
        >
          All areas
        </button>
      </div>

      <input
        className="nb-search"
        placeholder="Search plans, hosts, places..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="nb-chips">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={"nb-chip" + (cat === c ? " on" : "")}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="nb-note">
          {scope === "near"
            ? "No plans near you yet. Try All areas, or create the first one."
            : "No plans match. Be the first to create one."}
        </p>
      ) : (
        <div className="plan-list">
          {filtered.map((p) => {
            const full = p.maxPeople != null && p.count >= p.maxPeople;
            const spots =
              p.maxPeople != null
                ? ` \u00b7 ${Math.max(0, p.maxPeople - p.count)} spots left`
                : "";
            return (
              <div key={p.id} className="plan-card2">
                <div className="plan-head">
                  <Link
                    href={`/u/${p.hostId}`}
                    className="plan-av"
                    aria-label={p.hostName}
                  >
                    {p.hostAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.hostAvatar} alt={p.hostName} />
                    ) : (
                      p.hostName.charAt(0).toUpperCase()
                    )}
                  </Link>
                  <div className="plan-head-nm">
                    <b>
                      {p.hostName}
                      {p.hostVerified && (
                        <span className="plan-vf" aria-label="Verified">
                          {"\u2713"}
                        </span>
                      )}
                    </b>
                    <small>{p.county ?? "Flexible location"}</small>
                  </div>
                  <JoinPlanButton
                    planId={p.id}
                    isHost={p.isHost}
                    joined={p.joined}
                    full={full}
                  />
                </div>

                <span className="plan-when-pill">{whenPill(p.startsAt)}</span>
                <Link href={`/plans/${p.id}`} className="plan-title2">
                  {p.title}
                </Link>
                {p.description && <p className="plan-desc">{p.description}</p>}

                <div className="plan-foot2">
                  {p.category && <span className="plan-cat">{p.category}</span>}
                  <div className="plan-goers">
                    {p.goers.slice(0, 4).map((g) => (
                      <span key={g.id} className="plan-goer-av" title={g.name}>
                        {g.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.avatar} alt={g.name} />
                        ) : (
                          g.name.charAt(0).toUpperCase()
                        )}
                      </span>
                    ))}
                    <span className="plan-going-n">
                      {p.count} going{spots}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
