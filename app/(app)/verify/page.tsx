import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import VerificationSetup from "@/components/VerificationSetup";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification, onboarding_done")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.onboarding_done) redirect("/onboarding");

  const { data: verifReq } = await supabase
    .from("verification_requests")
    .select("status, note")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
        <span className="feed-title">Get verified</span>
      </div>

      <div className="verify-hero">
        <span className="verify-hero-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24">
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
        </span>
        <h2>Stand out with the verified badge</h2>
        <p className="sub">
          Verified profiles get more likes, more replies, and rank higher in
          Discover and top matches. It only takes a minute.
        </p>
      </div>

      <VerificationSetup
        userId={user.id}
        verification={profile.verification}
        pending={verifReq?.status === "pending"}
        rejectedNote={verifReq?.status === "rejected" ? verifReq.note : null}
      />

      <BottomNav />
    </main>
  );
}
