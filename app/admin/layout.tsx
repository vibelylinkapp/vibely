import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          Vibely <span>Admin</span>
        </div>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/analytics">Analytics</Link>
          <Link href="/admin/revenue">Revenue</Link>
          <Link href="/admin/retention">Retention</Link>
          <Link href="/admin/alerts">Alerts</Link>
          <Link href="/admin/reports">Reports</Link>
          <Link href="/admin/verifications">Verifications</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/announcements">Announcements</Link>
          <Link href="/home">Back to app</Link>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
