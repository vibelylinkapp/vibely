import Link from "next/link";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/safety", label: "Safety" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function SiteFooter({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  return (
    <footer className={"site-foot" + (tone === "light" ? " light" : "")}>
      <nav className="site-foot-links" aria-label="Footer">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
      </nav>
      <p className="site-foot-note">
        Made in {SITE.city}, for Kenya and East Africa.
        <span> &copy; {new Date().getFullYear()} {SITE.legalEntity}</span>
      </p>
    </footer>
  );
}
