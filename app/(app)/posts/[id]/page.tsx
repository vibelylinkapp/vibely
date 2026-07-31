import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import PostComments from "@/components/PostComments";

export const dynamic = "force-dynamic";

type Person = { id: string; display_name: string; avatar_url: string | null };

export default async function PostDetailPage({
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

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, media_url, caption, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  const profMap: Record<string, Person> = {};
  const seed = Array.from(new Set([post.author_id, user.id]));
  const { data: seedProfs } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", seed);
  (seedProfs ?? []).forEach((p) => {
    profMap[p.id] = p;
  });

  const [{ data: likeRows }, { data: cRows }] = await Promise.all([
    supabase.from("post_likes").select("profile_id").eq("post_id", id),
    supabase
      .from("post_comments")
      .select("id, author_id, body, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
  ]);
  const likeCount = (likeRows ?? []).length;
  const liked = (likeRows ?? []).some((r) => r.profile_id === user.id);

  const commenterIds = Array.from(
    new Set((cRows ?? []).map((c) => c.author_id))
  ).filter((cid) => !profMap[cid]);
  if (commenterIds.length) {
    const { data: cp } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", commenterIds);
    (cp ?? []).forEach((p) => {
      profMap[p.id] = p;
    });
  }

  const fallback = (pid: string): Person =>
    profMap[pid] ?? { id: pid, display_name: "Vibely member", avatar_url: null };

  const author = fallback(post.author_id);
  const me = profMap[user.id] ?? {
    id: user.id,
    display_name: "You",
    avatar_url: null,
  };
  const comments = (cRows ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: fallback(c.author_id),
  }));

  return (
    <main className="detail-wrap">
      <header className="detail-head">
        <Link href="/home" className="thread-back" aria-label="Back">
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
        <span className="detail-head-name">Post</span>
      </header>

      <div className="post-detail">
        <PostCard
          postId={post.id}
          author={author}
          mediaUrl={post.media_url}
          caption={post.caption}
          createdAt={post.created_at}
          likeCount={likeCount}
          liked={liked}
          commentCount={comments.length}
          canDelete={post.author_id === user.id}
        />
        <PostComments postId={post.id} me={me} initial={comments} />
      </div>

      <BottomNav />
    </main>
  );
}
