import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Chat from "@/components/Chat";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
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

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const { data: others } = await supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", id)
    .neq("profile_id", user.id);
  const otherId = others?.[0]?.profile_id ?? null;

  let otherName = "Vibely member";
  let otherAvatar: string | null = null;
  if (otherId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", otherId)
      .single();
    if (prof) {
      otherName = prof.display_name;
      otherAvatar = prof.avatar_url;
    }
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("profile_id", user.id);

  return (
    <main className="thread-wrap">
      <header className="thread-head">
        <Link href="/messages" className="thread-back" aria-label="Back to messages">
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
        <div className="thread-avatar">
          {otherAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherAvatar} alt={otherName} />
          ) : (
            otherName.charAt(0).toUpperCase()
          )}
        </div>
        <span className="thread-name">{otherName}</span>
      </header>

      <Chat
        conversationId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </main>
  );
}
