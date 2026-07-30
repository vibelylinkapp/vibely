"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
