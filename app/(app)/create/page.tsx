import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import CreatePost from "@/components/CreatePost";
import AddStory from "@/components/AddStory";
import CreatePlan from "@/components/CreatePlan";
import EventForm from "@/components/EventForm";
import CheckInForm from "@/components/CheckInForm";

export const dynamic = "force-dynamic";

const arrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

function Row({
  icon,
  bg,
  title,
  sub,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  sub: string;
}) {
  return (
    <>
      <span className="create-alt-ic" style={{ background: bg }}>
        {icon}
      </span>
      <span className="create-alt-body">
        <span className="create-alt-t">{title}</span>
        <span className="create-alt-s">{sub}</span>
      </span>
      <span className="create-alt-arrow">{arrow}</span>
    </>
  );
}

const storyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);
const planIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M8 2v4M16 2v4M3 10h18" />
  </svg>
);
const eventIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9 5.5-.8z" />
  </svg>
);
const checkinIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("county")
    .eq("id", user.id)
    .maybeSingle();
  const county = profile?.county ?? null;

  return (
    <main className="feed-wrap">
      <div className="feed-head">
        <span className="feed-title">Create</span>
      </div>

      <p className="create-intro">
        Share a moment, host something, or let people know you&apos;re out.
      </p>
      <CreatePost userId={user.id} />

      <div className="create-actions">
        <AddStory
          userId={user.id}
          triggerClass="create-alt"
          triggerContent={
            <Row
              icon={storyIcon}
              bg="linear-gradient(135deg,#7A2FF2,#F5307E)"
              title="Add to your story"
              sub="A photo that disappears in 24 hours"
            />
          }
        />
        <CreatePlan
          triggerClass="create-alt"
          triggerContent={
            <Row
              icon={planIcon}
              bg="linear-gradient(135deg,#F5307E,#FF7A59)"
              title="Post a plan"
              sub="Host a meetup and invite people to join"
            />
          }
        />
        <EventForm
          triggerClass="create-alt"
          triggerContent={
            <Row
              icon={eventIcon}
              bg="linear-gradient(135deg,#FF7A59,#FFB020)"
              title="Create an event"
              sub="Ticketed or free, with a map pin"
            />
          }
        />
        <CheckInForm
          userId={user.id}
          county={county}
          triggerClass="create-alt"
          triggerContent={
            <Row
              icon={checkinIcon}
              bg="linear-gradient(135deg,#F5307E,#7A2FF2)"
              title="Drop a live check-in"
              sub="Show you're out and open to meet"
            />
          }
        />
      </div>

      <BottomNav />
    </main>
  );
}
