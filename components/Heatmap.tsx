"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Cell = { lat: number; lng: number; weight: number };

// Nairobi metro viewport for the density canvas.
const BOUNDS = { latMin: -1.47, latMax: -1.15, lngMin: 36.62, lngMax: 36.98 };

const AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Westlands", lat: -1.2649, lng: 36.8038 },
  { name: "CBD", lat: -1.2864, lng: 36.8172 },
  { name: "Kilimani", lat: -1.2907, lng: 36.7869 },
  { name: "Karen", lat: -1.3197, lng: 36.7085 },
  { name: "Runda", lat: -1.2167, lng: 36.8072 },
  { name: "Kasarani", lat: -1.2216, lng: 36.8969 },
  { name: "Lang'ata", lat: -1.352, lng: 36.742 },
  { name: "South B", lat: -1.3082, lng: 36.836 },
];

function projX(lng: number): number {
  return ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
}
function projY(lat: number): number {
  return ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
}
function inBounds(lat: number, lng: number): boolean {
  return (
    lat <= BOUNDS.latMax &&
    lat >= BOUNDS.latMin &&
    lng >= BOUNDS.lngMin &&
    lng <= BOUNDS.lngMax
  );
}

export default function Heatmap() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("heatmap_cells", {
      cell: 0.02,
      online_only: onlineOnly,
    });
    if (error === null) {
      setCells((data ?? []) as Cell[]);
      setUpdatedAt(new Date());
    }
    setLoading(false);
  }, [onlineOnly]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const visible = useMemo(
    () => cells.filter((c) => inBounds(c.lat, c.lng)),
    [cells]
  );
  const total = useMemo(
    () => visible.reduce((s, c) => s + c.weight, 0),
    [visible]
  );
  const maxW = useMemo(
    () => visible.reduce((m, c) => (c.weight > m ? c.weight : m), 1),
    [visible]
  );
  const hottest = useMemo(() => {
    if (visible.length === 0) return null;
    const top = visible.reduce((a, b) => (b.weight > a.weight ? b : a));
    let best = AREAS[0];
    let bestD = Infinity;
    for (const a of AREAS) {
      const d = (a.lat - top.lat) ** 2 + (a.lng - top.lng) ** 2;
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return best.name;
  }, [visible]);

  return (
    <div className="hm">
      <div className="hm-bar">
        <div className="hm-live">
          <span className="hm-live-dot" />
          Live
        </div>
        <button
          type="button"
          className={"nb-chip" + (onlineOnly ? " on" : "")}
          onClick={() => setOnlineOnly((v) => v === false)}
          aria-pressed={onlineOnly}
        >
          Online now
        </button>
      </div>

      <div className="hm-canvas" aria-label="Member density heatmap of Nairobi">
        {AREAS.map((a) => (
          <span
            key={a.name}
            className="hm-area"
            style={{ left: `${projX(a.lng)}%`, top: `${projY(a.lat)}%` }}
          >
            {a.name}
          </span>
        ))}
        {visible.map((c, i) => {
          const t = c.weight / maxW;
          const size = 30 + t * 96;
          return (
            <span
              key={`${c.lat}-${c.lng}-${i}`}
              className="hm-blob"
              style={{
                left: `${projX(c.lng)}%`,
                top: `${projY(c.lat)}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: 0.35 + t * 0.5,
              }}
            />
          );
        })}
        {loading && visible.length === 0 && (
          <span className="hm-loading">Loading density...</span>
        )}
        {loading === false && visible.length === 0 && (
          <span className="hm-loading">No one is sharing location yet.</span>
        )}
      </div>

      <div className="hm-stats">
        <div className="hm-stat">
          <span className="hm-stat-n">{total}</span>
          <span className="hm-stat-l">
            {onlineOnly ? "online now" : "people on the map"}
          </span>
        </div>
        {hottest && (
          <div className="hm-stat">
            <span className="hm-stat-n">{hottest}</span>
            <span className="hm-stat-l">hottest area</span>
          </div>
        )}
      </div>

      <div className="hm-legend">
        <span>Fewer</span>
        <span className="hm-legend-bar" />
        <span>More</span>
      </div>

      <p className="nb-note">
        The heatmap shows aggregated density only, never individuals or exact
        locations. People who hide their location are not counted.
        {updatedAt &&
          ` Updated ${updatedAt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}.`}
      </p>
    </div>
  );
}
