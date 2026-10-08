"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SwipeDeck from "./SwipeDeck";
import EmptyState from "./EmptyState";
import WhatsAppAskButton from "./WhatsAppAskButton";

type NearbyRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  county: string | null;
  distance_m: number;
  is_online: boolean;
  is_verified: boolean;
};

// Central Nairobi - used until (and if) the browser shares a precise location.
const NAIROBI = { lat: -1.2921, lng: 36.8219 };
const RADII = [5, 10, 25, 50];

function fmtDistance(m: number): string {
  if (m < 950) return `${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

// Stable pseudo-bearing from the id. Distance on the radar is real; the
// direction is deliberately obfuscated so exact locations are never exposed.
function bearingFor(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i = i + 1) {
    h = (h ^ id.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  return ((h % 3600) / 3600) * Math.PI * 2;
}

function VerifiedTick() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verified">
      <circle cx="12" cy="12" r="12" fill="#FFB020" />
      <path
        d="M7 12.5l3 3 7-7"
        fill="none"
        stroke="#12151D"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NearbyExplorer({ meId }: { meId: string }) {
  const [center, setCenter] = useState(NAIROBI);
  const [located, setLocated] = useState<"pending" | "yes" | "no">("pending");
  const [radiusKm, setRadiusKm] = useState(10);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [view, setView] = useState<"grid" | "map" | "swipe">("grid");
  const [rows, setRows] = useState<NearbyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [boosted, setBoosted] = useState<Set<string>>(new Set());
  // Each search gets an id. Only the newest one may update the results or
  // clear the loading state, so a slow earlier search (e.g. 10 km finishing
  // after 25 km was picked) can no longer leave the screen stuck searching.
  const reqRef = useRef(0);

  // Ask the browser for a precise location once; fall back to central Nairobi.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocated("no");
      return;
    }
    // The browser's own timeout does not start until the permission prompt
    // is answered, so an ignored prompt used to leave "Finding your
    // location..." up forever. Fall back to central Nairobi after 10s.
    const fallback = setTimeout(
      () => setLocated((s) => (s === "pending" ? "no" : s)),
      10000
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallback);
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocated("yes");
      },
      () => {
        clearTimeout(fallback);
        setLocated("no");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
    return () => clearTimeout(fallback);
  }, []);

  // Active boosts, so promoted profiles can be labelled and listed first.
  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("boosts")
      .select("profile_id")
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => {
        if (cancelled) return;
        setBoosted(new Set((data ?? []).map((b) => b.profile_id)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchNearby = useCallback(async () => {
    const req = reqRef.current + 1;
    reqRef.current = req;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("nearby_profiles", {
        in_lat: center.lat,
        in_lng: center.lng,
        radius_m: radiusKm * 1000,
      });
      if (reqRef.current === req) {
        setRows(error ? [] : (data ?? []).filter((r) => r.id !== meId));
      }
    } catch {
      if (reqRef.current === req) setRows([]);
    } finally {
      if (reqRef.current === req) setLoading(false);
    }
  }, [center, radiusKm, meId]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const filtered = useMemo(() => {
    const list = rows.filter(
      (r) =>
        (verifiedOnly === false || r.is_verified) &&
        (onlineOnly === false || r.is_online)
    );
    // Boosted profiles first; otherwise keep the distance order.
    return [...list].sort(
      (a, b) => Number(boosted.has(b.id)) - Number(boosted.has(a.id))
    );
  }, [rows, verifiedOnly, onlineOnly, boosted]);

  const nextRadius = RADII.find((r) => r > radiusKm);

  const onlineCount = useMemo(
    () => filtered.filter((r) => r.is_online).length,
    [filtered]
  );

  return (
    <div className="nb">
      <p className="nb-loc">
        {located === "yes"
          ? "Showing people around your current location."
          : located === "pending"
            ? "Finding your location..."
            : "Showing central Nairobi. Allow location for precise results."}
      </p>

      <div className="nb-controls">
        <div className="nb-radii" role="group" aria-label="Search radius">
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              className={"nb-radius" + (radiusKm === r ? " on" : "")}
              onClick={() => setRadiusKm(r)}
              aria-pressed={radiusKm === r}
            >
              {r} km
            </button>
          ))}
        </div>
        <div className="nb-toggles">
          <button
            type="button"
            className={"nb-chip" + (verifiedOnly ? " on" : "")}
            onClick={() => setVerifiedOnly((v) => v === false)}
            aria-pressed={verifiedOnly}
          >
            Verified
          </button>
          <button
            type="button"
            className={"nb-chip" + (onlineOnly ? " on" : "")}
            onClick={() => setOnlineOnly((v) => v === false)}
            aria-pressed={onlineOnly}
          >
            Online now
          </button>
        </div>
      </div>

      <div className="nb-viewbar">
        <span className="nb-count">
          {loading
            ? "Searching..."
            : `${filtered.length} ${
                filtered.length === 1 ? "person" : "people"
              } within ${radiusKm} km` +
              (onlineCount > 0 ? ` · ${onlineCount} online` : "")}
        </span>
        <div className="nb-viewtoggle" role="group" aria-label="View">
          <button
            type="button"
            className={"nb-vt" + (view === "swipe" ? " on" : "")}
            onClick={() => setView("swipe")}
            aria-pressed={view === "swipe"}
          >
            Swipe
          </button>
          <button
            type="button"
            className={"nb-vt" + (view === "grid" ? " on" : "")}
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            Grid
          </button>
          <button
            type="button"
            className={"nb-vt" + (view === "map" ? " on" : "")}
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
          >
            Map
          </button>
        </div>
      </div>

      {loading ? (
        <p className="nb-empty">Looking for people near you...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          }
          title={`No people found within ${radiusKm} km`}
          body={
            verifiedOnly || onlineOnly
              ? "Try a wider distance or turn off the Verified and Online now filters."
              : "Try a wider distance. Vibely is still growing in your area, so check back soon."
          }
          action={
            nextRadius ? (
              <button
                type="button"
                className="btn emp-cta"
                onClick={() => setRadiusKm(nextRadius)}
              >
                Search within {nextRadius} km
              </button>
            ) : undefined
          }
        />
      ) : view === "swipe" ? (
        <SwipeDeck rows={filtered} meId={meId} />
      ) : view === "grid" ? (
        <div className="nb-grid">
          {filtered.map((r) => (
            <div key={r.id} className="nb-cell">
              <Link
                href={`/u/${r.id}`}
                className={"nb-card" + (boosted.has(r.id) ? " is-boosted" : "")}
              >
              <div className="nb-ph">
                {r.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatar_url} alt={r.display_name} />
                ) : (
                  <span className="nb-initial">
                    {r.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
                {r.is_online && <span className="nb-dot" />}
                {boosted.has(r.id) && (
                  <span className="pcard-boost" title="This profile is boosted">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                    </svg>
                    Boosted
                  </span>
                )}
              </div>
              <div className="nb-info">
                <span className="nb-name">
                  {r.display_name}
                  {r.is_verified && <VerifiedTick />}
                </span>
                <span className="nb-dist">{fmtDistance(r.distance_m)}</span>
              </div>
              </Link>
              <WhatsAppAskButton
                otherId={r.id}
                otherName={r.display_name}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="nb-radar" aria-label="Nearby radar">
          <span className="nb-ring nb-ring-3" />
          <span className="nb-ring nb-ring-2" />
          <span className="nb-ring nb-ring-1" />
          <span className="nb-ring-label nb-rl-out">{radiusKm} km</span>
          <span className="nb-ring-label nb-rl-mid">
            {Math.round((radiusKm * 2) / 3)} km
          </span>
          <span className="nb-me" aria-label="You are here">
            You
          </span>
          {filtered.map((r) => {
            const frac = Math.min(1, r.distance_m / (radiusKm * 1000));
            const ang = bearingFor(r.id);
            const R = 45;
            const x = 50 + Math.cos(ang) * frac * R;
            const y = 50 + Math.sin(ang) * frac * R;
            return (
              <Link
                key={r.id}
                href={`/u/${r.id}`}
                className={
                  "nb-pin" +
                  (r.is_online ? " online" : "") +
                  (boosted.has(r.id) ? " boosted" : "")
                }
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${r.display_name} · ${fmtDistance(r.distance_m)}`}
                aria-label={`${r.display_name}, ${fmtDistance(r.distance_m)}`}
              >
                {r.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatar_url} alt="" />
                ) : (
                  <span className="nb-pin-initial">
                    {r.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {view !== "swipe" && (
        <p className="nb-note">
          On the map, distance is exact but direction is scrambled to protect
          everyone&apos;s privacy. Members who hide their location never appear
          here.
        </p>
      )}
    </div>
  );
}
