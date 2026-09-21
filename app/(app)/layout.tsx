import BottomNav from "@/components/BottomNav";

/**
 * Shared shell for every signed-in route.
 *
 * This layout exists to keep the tab bar MOUNTED across navigations, and
 * that is a performance fix rather than a tidiness one.
 *
 * Before it, all 22 signed-in pages rendered <BottomNav /> themselves and
 * loading.tsx sat at the root of this group with nothing above it. A
 * Suspense fallback replaces everything below its own boundary, so with no
 * layout in between, tapping a tab blanked the ENTIRE viewport -- tab bar
 * included -- and swapped in a full-height skeleton until the server
 * finished rendering the next (force-dynamic) page. That full-screen wipe
 * is what read as a white flash on every navigation.
 *
 * With the shell here, the fallback can only replace {children}. The tab
 * bar stays put, stays interactive, and the app stops feeling like it
 * reloads on every tap.
 *
 * Kept deliberately free of data fetching: the tab bar is a client
 * component that loads its own unread badge, so this layout adds no
 * Supabase round trip to any navigation.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
