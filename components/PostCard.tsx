import Link from "next/link";
import PostLike from "@/components/PostLike";

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
}: {
  postId: string;
  author: Author;
  mediaUrl: string | null;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
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
      </header>
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-media" src={mediaUrl} alt="" />
      )}
      <div className="post-body">
        <PostLike postId={postId} initialLiked={liked} initialCount={likeCount} />
        {caption && (
          <p className="post-caption">
            <span className="post-caption-name">
              {author.display_name.split(" ")[0]}
            </span>{" "}
            {caption}
          </p>
        )}
      </div>
    </article>
  );
}
