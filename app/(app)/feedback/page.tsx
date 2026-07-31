import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import FeedbackForm from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="feed-wrap">
      <div className="feed-head verify-head-row">
        <Link href="/profile" className="thread-back" aria-label="Back">
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
        <span className="feed-title">Share feedback</span>
      </div>

      <div className="verify-hero">
        <h2>Help shape Vibely</h2>
        <p className="sub">
          Vibely is built for Nairobi, by listening to you. Tell us what&apos;s
          working and what we can make better — we read everything.
        </p>
      </div>

      <FeedbackForm userId={user.id} />

      <BottomNav />
    </main>
  );
}
