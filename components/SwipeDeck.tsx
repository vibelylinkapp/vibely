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

// Horizontal drag distance (px) that commits a like (right) or pass (left).
const THRESHOLD = 110;

function fmtDistance(m: number): string {
  if (m < 950) return `${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function VerifiedTick() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-label="Verified">
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [liked, passed] = await Promise.all([
        supabase.from("likes").select("liked_id").eq("liker_id", meId),
        supabase.from("passes").select("passed_id").eq("passer_id", meId),
      ]);
      if (cancelled) return;
      const ids = new Set<string>();
      for (const r of liked.data ?? []) ids.add(r.liked_id);
      // The passes table may not exist yet (pre-migration) — that just returns
      // an error with null data, so passes are simply not excluded until then.
      for (const r of passed.data ?? []) ids.add(r.passed_id);
      setExcluded(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [meId]);

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
    if (dx > THRESHOLD) {
      setDrag((d) => ({ ...d, active: false }));
      fling("like");
      return;
    }
    if (dx < -THRESHOLD) {
      setDrag((d) => ({ ...d, active: false }));
      fling("nope");
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
        {visible
          .map((card, i) => {
            const isTop = i === 0;
            const isLeaving = leaving?.id === card.id;
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
              // Cards behind the top sit slightly scaled down and pushed back.
              transform = `translateY(${i * 12}px) scale(${1 - i * 0.05})`;
            }
            const noTransition = isTop && drag.active && !isLeaving;
            return (
              <div
                key={card.id}
                className={"sw-card" + (isTop ? " top" : "")}
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
                    <img src={card.avatar_url} alt={card.display_name} draggable={false} />
                  ) : (
                    <span className="sw-initial">
                      {card.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {card.is_online && <span className="sw-online" />}

                  {isTop && (
                    <>
                      <span
                        className="sw-stamp like"
                        style={{ opacity: isLeaving && leaving?.dir === "like" ? 1 : likeHint }}
                      >
                        LIKE
                      </span>
                      <span
                        className="sw-stamp nope"
                        style={{ opacity: isLeaving && leaving?.dir === "nope" ? 1 : nopeHint }}
                      >
                        NOPE
                      </span>
                    </>
                  )}

                  <div className="sw-meta">
                    <span className="sw-name">
                      {card.display_name}
                      {card.is_verified && <VerifiedTick />}
                    </span>
                    <span className="sw-sub">
                      {fmtDistance(card.distance_m)}
                      {card.county ? ` · ${card.county}` : ""}
                      {card.is_online ? " · Online now" : ""}
                    </span>
                  </div>
                </div>
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
        {top && (
          <Link href={`/u/${top.id}`} className="sw-btn info" aria-label="View full profile">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 11v5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="7.6" r="1.3" fill="currentColor" />
            </svg>
          </Link>
        )}
        <button
          type="button"
          className="sw-btn like"
          onClick={() => fling("like")}
          disabled={!top || !!leaving}
          aria-label="Like"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.6 5.5c1.9 0 3.1 1.1 3.9 2.2.8-1.1 2-2.2 3.9-2.2 3.1 0 4.6 3 3.1 6C19 15.65 12 20 12 20z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <p className="sw-tip">Swipe right to like, left to pass — or use the buttons.</p>

      {match && (
        <div className="sw-match" role="dialog" aria-label="It's a match" aria-live="polite">
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
              {opening ? "Opening..." : `Message ${match.display_name.split(" ")[0]}`}
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
