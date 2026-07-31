import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type FeedAuthor = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type FeedItem = {
  postId: string;
  author: FeedAuthor;
  mediaUrl: string | null;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  canDelete: boolean;
  canReport: boolean;
};

export const FEED_PAGE_SIZE = 10;

// One page of the feed, enriched exactly like the home render expects. Shared by
// the initial server render (app/(app)/home) and the /api/feed load-more route so
// both produce identical PostCard props. Cursor is the created_at of the last
// RAW row fetched (before block/hide filtering) so paging never skips rows.
export async function getFeedPage(
  db: SupabaseClient<Database>,
  userId: string,
  opts: { cursor?: string | null; limit?: number } = {}
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const limit = opts.limit ?? FEED_PAGE_SIZE;

  const [{ data: blockRows }, { data: hideRows }] = await Promise.all([
    db.from("blocks").select("blocked_id").eq("blocker_id", userId),
    db.from("post_hides").select("post_id").eq("profile_id", userId),
  ]);
  const blocked = new Set((blockRows ?? []).map((b) => b.blocked_id));
  const hidden = new Set((hideRows ?? []).map((h) => h.post_id));

  let query = db
    .from("posts")
    .select("id, author_id, media_url, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);
  const { data: rawRows } = await query;
  const raw = rawRows ?? [];
  const nextCursor =
    raw.length === limit ? raw[raw.length - 1].created_at : null;

  const posts = raw.filter(
    (p) => !blocked.has(p.author_id) && !hidden.has(p.id)
  );

  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const authors: Record<string, FeedAuthor> = {};
  if (authorIds.length) {
    const { data: pa } = await db
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    (pa ?? []).forEach((a) => {
      authors[a.id] = a;
    });
  }

  const postIds = posts.map((p) => p.id);
  const likeCount: Record<string, number> = {};
  const myLiked = new Set<string>();
  const commentCount: Record<string, number> = {};
  if (postIds.length) {
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      db.from("post_likes").select("post_id, profile_id").in("post_id", postIds),
      db.from("post_comments").select("post_id").in("post_id", postIds),
    ]);
    (likeRows ?? []).forEach((r) => {
      likeCount[r.post_id] = (likeCount[r.post_id] ?? 0) + 1;
      if (r.profile_id === userId) myLiked.add(r.post_id);
    });
    (commentRows ?? []).forEach((r) => {
      commentCount[r.post_id] = (commentCount[r.post_id] ?? 0) + 1;
    });
  }

  const items: FeedItem[] = [];
  for (const p of posts) {
    const a = authors[p.author_id];
    if (!a) continue; // author has blocked me -> their profile is hidden
    items.push({
      postId: p.id,
      author: a,
      mediaUrl: p.media_url,
      caption: p.caption,
      createdAt: p.created_at,
      likeCount: likeCount[p.id] ?? 0,
      liked: myLiked.has(p.id),
      commentCount: commentCount[p.id] ?? 0,
      canDelete: p.author_id === userId,
      canReport: p.author_id !== userId,
    });
  }

  return { items, nextCursor };
}
