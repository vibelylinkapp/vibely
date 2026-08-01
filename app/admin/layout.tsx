import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { ADMIN_PATH } from "@/lib/admin/path";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const base = `/${ADMIN_PATH}`;

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          Vibely <span>Admin</span>
        </div>
        <nav>
          <Link href={base}>Dashboard</Link>
          <Link href={`${base}/analytics`}>Analytics</Link>
          <Link href={`${base}/revenue`}>Revenue</Link>
          <Link href={`${base}/retention`}>Retention</Link>
          <Link href={`${base}/alerts`}>Alerts</Link>
          <Link href={`${base}/reports`}>Reports</Link>
          <Link href={`${base}/verifications`}>Verifications</Link>
          <Link href={`${base}/events`}>Events</Link>
          <Link href={`${base}/announcements`}>Announcements</Link>
          <Link href={`${base}/feedback`}>Feedback</Link>
          <Link href="/home">Back to app</Link>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
