"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostCard from "@/components/PostCard";
import type { FeedItem } from "@/lib/feed";

// Appends further feed pages below the server-rendered first page. Observes a
// sentinel near the bottom and pulls /api/feed?cursor=... until exhausted.
export default function FeedLoadMore({
  initialCursor,
  seenIds,
}: {
  initialCursor: string | null;
  seenIds: string[];
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialCursor === null);
  const seen = useRef<Set<string>>(new Set(seenIds));
  const sentinel = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<string | null>(initialCursor);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !cursorRef.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/feed?cursor=${encodeURIComponent(cursorRef.current)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setDone(true);
        return;
      }
      const json = (await res.json()) as {
        items?: FeedItem[];
        nextCursor?: string | null;
      };
      const fresh = (json.items ?? []).filter((it) => !seen.current.has(it.postId));
      fresh.forEach((it) => seen.current.add(it.postId));
      setItems((prev) => [...prev, ...fresh]);
      const nc = json.nextCursor ?? null;
      cursorRef.current = nc;
      setCursor(nc);
      if (!nc) setDone(true);
    } catch {
      setDone(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, done, cursor]);

  return (
    <>
      {items.map((it) => (
        <PostCard
          key={it.postId}
          postId={it.postId}
          author={it.author}
          mediaUrl={it.mediaUrl}
          caption={it.caption}
          createdAt={it.createdAt}
          likeCount={it.likeCount}
          liked={it.liked}
          commentCount={it.commentCount}
          canDelete={it.canDelete}
          canReport={it.canReport}
        />
      ))}
      {!done && <div ref={sentinel} className="feed-sentinel" aria-hidden="true" />}
      {loading && <p className="feed-loading">Loading more...</p>}
    </>
  );
}
