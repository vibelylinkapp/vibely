"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type SwipeRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  county: string | null;
  distance_m: number;
  is_online: boolean;
  is_verified: boolean;
};

type CardDetail = {
  age: number | null;
  bio: string | null;
  area: string | null;
  interests: string[];
};

// Horizontal drag (px) that commits a like/pass; upward drag that opens profile.
const THRESHOLD = 110;
const SWIPE_UP = 90;

function fmtDistance(m: number): string {
  if (m < 950) return `${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1;
  return a;
}

function VerifiedTick({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified">
      <circle cx="12" cy="12" r="12" fill="#7A2FF2" />
      <path
        d="M7 12.5l3 3 7-7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SwipeDeck({
  rows,
  meId,
}: {
  rows: SwipeRow[];
  meId: string;
}) {
  const router = useRouter();
  // Ids acted on this session (liked or passed) are hidden from the deck.
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set<string>());
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<{ id: string; dir: "like" | "nope" } | null>(
    null
  );
  const [match, setMatch] = useState<SwipeRow | null>(null);
  const [opening, setOpening] = useState(false);
  const [limited, setLimited] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // People I've already liked or passed stay hidden across sessions.
  const [excluded, setExcluded] = useState<Set<string> | null>(null);
  const [meVerified, setMeVerified] = useState<boolean | null>(null);
  const [details, setDetails] = useState<Map<string, CardDetail>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [liked, passed, meProf] = await Promise.all([
        supabase.from("likes").select("liked_id").eq("liker_id", meId),
        supabase.from("passes").select("passed_id").eq("passer_id", meId),
        supabase.from("profiles").select("is_verified").eq("id", meId).maybeSingle(),
      ]);
      if (cancelled) return;
      const ids = new Set<string>();
      for (const r of liked.data ?? []) ids.add(r.liked_id);
      // The passes table may not exist yet (pre-migration) — that just returns
      // an error with null data, so passes are simply not excluded until then.
      for (const r of passed.data ?? []) ids.add(r.passed_id);
      setExcluded(ids);
      setMeVerified(!!meProf.data?.is_verified);
    })();
    return () => {
      cancelled = true;
    };
  }, [meId]);

  // Enrich the cards with age / bio / area / interests in two batched reads.
  useEffect(() => {
    const ids = Array.from(
      new Set(rows.map((r) => r.id).filter((id) => id !== meId))
    );
    if (ids.length === 0) {
      setDetails(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [profs, ints] = await Promise.all([
        supabase.from("profiles").select("id, birthdate, bio, area").in("id", ids),
        supabase
          .from("profile_intents")
          .select("profile_id, intent")
          .in("profile_id", ids),
      ]);
      if (cancelled) return;
      const intentMap = new Map<string, string[]>();
      for (const r of ints.data ?? []) {
        const list = intentMap.get(r.profile_id) ?? [];
        if (list.length < 6) list.push(r.intent);
        intentMap.set(r.profile_id, list);
      }
      const next = new Map<string, CardDetail>();
      for (const p of profs.data ?? []) {
        next.set(p.id, {
          age: p.birthdate ? ageFrom(p.birthdate) : null,
          bio: p.bio,
          area: p.area,
          interests: intentMap.get(p.id) ?? [],
        });
      }
      setDetails(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, meId]);

  const deck = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.id !== meId &&
          !doneIds.has(r.id) &&
          !(excluded ? excluded.has(r.id) : false)
      ),
    [rows, meId, doneIds, excluded]
  );
  // Render the top three for a layered stack; only the top card is interactive.
  const visible = deck.slice(0, 3);
  const top = visible[0];

  const settle = useCallback((id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setLeaving(null);
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
  }, []);

  const recordLike = useCallback(async (target: SwipeRow) => {
    try {
      // Like creation runs server-side so the free daily quota can't be
      // bypassed from the client. Same contract the profile card uses.
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: target.id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        matched?: boolean;
        reason?: string;
      };
      if (res.status === 429 && json.reason === "daily_limit") {
        setLimited(true);
        return;
      }
      if (json.ok && json.matched) {
        setMatch(target);
        // Notify the other person that they matched (best-effort).
        fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ toUserId: target.id, kind: "match" }),
        }).catch(() => {});
      }
    } catch {
      // Best-effort: a failed like simply means nothing was recorded.
    }
  }, []);

  const recordPass = useCallback(async (target: SwipeRow) => {
    try {
      // Persist the pass so this person is not shown again in future sessions.
      await fetch("/api/pass", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: target.id }),
      });
    } catch {
      // Best-effort: a failed pass just means it isn't remembered next time.
    }
  }, []);

  const fling = useCallback(
    (dir: "like" | "nope") => {
      if (!top || leaving) return;
      const target = top;
      setLeaving({ id: target.id, dir });
      if (dir === "like") void recordLike(target);
      else void recordPass(target);
      // Advance once the exit transition has played.
      window.setTimeout(() => settle(target.id), 300);
    },
    [top, leaving, recordLike, recordPass, settle]
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!top || leaving) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture is unavailable in some environments; drag still works.
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!startRef.current || !drag.active) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      active: true,
    });
  }

  function onPointerUp() {
    if (!startRef.current || !drag.active) return;
    const dx = drag.x;
    const dy = drag.y;
    // Dominant horizontal drag -> like / pass.
    if (Math.abs(dx) > THRESHOLD && Math.abs(dx) >= Math.abs(dy)) {
      setDrag((d) => ({ ...d, active: false }));
      fling(dx > 0 ? "like" : "nope");
      return;
    }
    // Upward drag -> open the full profile.
    if (dy < -SWIPE_UP && top) {
      setDrag({ x: 0, y: 0, active: false });
      startRef.current = null;
      router.push(`/u/${top.id}`);
      return;
    }
    // Under threshold: release and snap back to centre.
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
  }

  async function messageMatch(target: SwipeRow) {
    setOpening(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_conversation", {
      other_id: target.id,
    });
    if (error || !data) {
      setOpening(false);
      router.push(`/u/${target.id}`);
      return;
    }
    router.push(`/messages/${data}`);
  }

  const likeHint = clamp01(drag.x / THRESHOLD);
  const nopeHint = clamp01(-drag.x / THRESHOLD);

  if (excluded === null) {
    return (
      <div className="sw-empty">
        <p className="sw-empty-sub">Finding people near you...</p>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="sw-empty">
        <div className="sw-empty-ring" aria-hidden="true">
          <span className="sw-empty-heart">♥</span>
        </div>
        <p className="sw-empty-title">You&apos;re all caught up</p>
        <p className="sw-empty-sub">
          That&apos;s everyone here for now. Widen your radius or turn off filters
          above to see more people.
        </p>
        <Link href="/discover" className="sw-empty-cta">
          Browse everyone in Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="sw-wrap">
      {limited && (
        <div className="sw-limit" role="status">
          <span>You&apos;ve used your free likes for today.</span>
          <Link href="/upgrade" className="sw-limit-cta">
            Upgrade for unlimited
          </Link>
        </div>
      )}

      <div className="sw-deck" aria-label="People near you">
        {visible.map((card, i) => {
          const isTop = i === 0;
          const isLeaving = leaving?.id === card.id;
          const d = details.get(card.id);
          const place = d?.area || card.county || null;
          const chips = d?.interests ?? [];
          let transform: string;
          let opacity = 1;
          if (isLeaving) {
            const off = leaving?.dir === "like" ? 1 : -1;
            transform = `translate(${off * 130}%, -6%) rotate(${off * 18}deg)`;
            opacity = 0;
          } else if (isTop) {
            transform = `translate(${drag.x}px, ${drag.y}px) rotate(${
              drag.x * 0.05
            }deg)`;
          } else {
            transform = `translateY(${i * 14}px) scale(${1 - i * 0.05})`;
          }
          const noTransition = isTop && drag.active && !isLeaving;
          return (
            <div
              key={card.id}
              className={"sw-card" + (isTop ? " top" : " behind")}
              style={{
                transform,
                opacity,
                zIndex: visible.length - i,
                transition: noTransition
                  ? "none"
                  : "transform 0.32s ease, opacity 0.32s ease",
              }}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
            >
              <div className="sw-photo">
                {card.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.avatar_url}
                    alt={card.display_name}
                    draggable={false}
                  />
                ) : (
                  <span className="sw-initial">
                    {card.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {card.is_online && (
                <span className="sw-online-pill">
                  <span className="sw-online-dot" />
                  Online
                </span>
              )}
              {card.is_verified && (
                <span className="sw-shield" aria-label="Verified">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M7 12.5l3 3 7-7"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}

              {isTop && (
                <>
                  <span
                    className="sw-stamp like"
                    style={{
                      opacity:
                        isLeaving && leaving?.dir === "like" ? 1 : likeHint,
                    }}
                  >
                    LIKE
                  </span>
                  <span
                    className="sw-stamp nope"
                    style={{
                      opacity:
                        isLeaving && leaving?.dir === "nope" ? 1 : nopeHint,
                    }}
                  >
                    NOPE
                  </span>
                </>
              )}

              {isTop && (
                <div className="sw-meta">
                  <span className="sw-distance">
                    <PinIcon />
                    {fmtDistance(card.distance_m)}
                  </span>
                  <span className="sw-name">
                    {card.display_name}
                    {d?.age ? `, ${d.age}` : ""}
                    {card.is_verified && <VerifiedTick size={18} />}
                  </span>
                  {place && (
                    <span className="sw-place">
                      <PinIcon />
                      {place}
                    </span>
                  )}
                  {d?.bio && <span className="sw-bio">{d.bio}</span>}
                  {chips.length > 0 && (
                    <div className="sw-chips">
                      {chips.slice(0, 3).map((c) => (
                        <span className="sw-chip" key={c}>
                          {c}
                        </span>
                      ))}
                      {chips.length > 3 && (
                        <span className="sw-chip more">+{chips.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className="sw-seemore" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        d="M7 14l5-5 5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Swipe up to see more
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sw-actions" role="group" aria-label="Swipe actions">
        <button
          type="button"
          className="sw-btn nope"
          onClick={() => fling("nope")}
          disabled={!top || !!leaving}
          aria-label="Pass"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="sw-btn like"
          onClick={() => fling("like")}
          disabled={!top || !!leaving}
          aria-label="Like"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.6 5.5c1.9 0 3.1 1.1 3.9 2.2.8-1.1 2-2.2 3.9-2.2 3.1 0 4.6 3 3.1 6C19 15.65 12 20 12 20z"
              fill="currentColor"
            />
          </svg>
        </button>
        {top && (
          <Link
            href={`/u/${top.id}`}
            className="sw-btn msg"
            aria-label="View profile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 5h16v11H8l-4 3.5V5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
      </div>

      <p className="sw-tip">Swipe right to like, left to pass, up to view.</p>

      {meVerified === false && (
        <Link href="/profile" className="sw-verify">
          <span className="sw-verify-ic" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M12 2l7 4v6c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-4z" fill="#fff" opacity="0.18" />
              <path
                d="M8 12.5l3 3 5-6"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="sw-verify-txt">
            <strong>More visibility, more connections</strong>
            <span>Verify your profile to get 3x more views</span>
          </span>
          <span className="sw-verify-cta">Get Verified</span>
        </Link>
      )}

      {match && (
        <div
          className="sw-match"
          role="dialog"
          aria-label="It's a match"
          aria-live="polite"
        >
          <div className="sw-match-card">
            <p className="sw-match-title">It&apos;s a match!</p>
            <p className="sw-match-sub">
              You and {match.display_name.split(" ")[0]} liked each other.
            </p>
            <div className="sw-match-photo">
              {match.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.avatar_url} alt={match.display_name} />
              ) : (
                <span className="sw-initial">
                  {match.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              className="sw-match-msg"
              onClick={() => messageMatch(match)}
              disabled={opening}
            >
              {opening
                ? "Opening..."
                : `Message ${match.display_name.split(" ")[0]}`}
            </button>
            <button
              type="button"
              className="sw-match-keep"
              onClick={() => setMatch(null)}
              disabled={opening}
            >
              Keep swiping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
