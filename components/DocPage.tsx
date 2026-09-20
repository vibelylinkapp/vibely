import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

/**
 * Shared shell for the plain-content pages (about, safety, privacy, terms).
 * Deliberately quiet: one column, generous measure, no gradients competing
 * with the text.
 */
export default function DocPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="doc">
      <header className="doc-top">
        <Link href="/" className="doc-back" aria-label="Back to Vibely home">
          <span aria-hidden="true">&larr;</span> Vibely
        </Link>
        <Link href="/sign-in" className="doc-join">
          Join free
        </Link>
      </header>

      <article className="doc-body">
        <h1>{title}</h1>
        {intro ? <p className="doc-intro">{intro}</p> : null}
        {updated ? <p className="doc-updated">Last updated {updated}</p> : null}
        {children}
      </article>

      <SiteFooter tone="light" />
    </main>
  );
}
