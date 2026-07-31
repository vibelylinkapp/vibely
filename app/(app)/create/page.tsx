import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import CreatePost from "@/components/CreatePost";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Create</span>
      </div>

      <p className="create-intro">Share a moment with the Vibely community.</p>
      <CreatePost userId={user.id} />

      <Link href="/plans" className="create-alt">
        <span className="create-alt-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="3" />
            <path d="M8 2v4M16 2v4M3 10h18" />
          </svg>
        </span>
        <span className="create-alt-body">
          <span className="create-alt-t">Create a plan instead</span>
          <span className="create-alt-s">Host a meetup and invite people to join</span>
        </span>
        <span className="create-alt-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      <Link href="/events" className="create-alt">
        <span className="create-alt-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.5l5.4-.8z" />
          </svg>
        </span>
        <span className="create-alt-body">
          <span className="create-alt-t">Create an event</span>
          <span className="create-alt-s">Ticketed or free, with a map pin</span>
        </span>
        <span className="create-alt-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      <BottomNav />
    </main>
  );
}
