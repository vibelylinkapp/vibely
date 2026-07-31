import Link from "next/link";
import PostLike from "@/components/PostLike";
import DeletePost from "@/components/DeletePost";
import EditCaption from "@/components/EditCaption";

type Author = { id: string; display_name: string; avatar_url: string | null };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function PostCard({
  postId,
  author,
  mediaUrl,
  caption,
  createdAt,
  likeCount,
  liked,
  commentCount,
  canDelete,
}: {
  postId: string;
  author: Author;
  mediaUrl: string | null;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  canDelete?: boolean;
}) {
  return (
    <article className="post">
      <header className="post-head">
        <Link href={`/u/${author.id}`} className="post-av">
          {author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatar_url} alt={author.display_name} />
          ) : (
            author.display_name.charAt(0).toUpperCase()
          )}
        </Link>
        <div className="post-head-meta">
          <Link href={`/u/${author.id}`} className="post-name">
            {author.display_name}
          </Link>
          <span className="post-time">{timeAgo(createdAt)}</span>
        </div>
        {canDelete && <DeletePost postId={postId} mediaUrl={mediaUrl} />}
      </header>
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-media" src={mediaUrl} alt="" />
      )}
      <div className="post-body">
        <div className="post-actions">
          <PostLike
            postId={postId}
            authorId={author.id}
            initialLiked={liked}
            initialCount={likeCount}
          />
          <Link href={`/posts/${postId}`} className="post-comment" aria-label="Comments">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
            </svg>
            <span className="post-comment-n">{commentCount}</span>
          </Link>
        </div>
        <EditCaption
          postId={postId}
          firstName={author.display_name.split(" ")[0]}
          initialCaption={caption}
          canEdit={canDelete ?? false}
        />
      </div>
    </article>
  );
}
