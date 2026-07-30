"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={path === it.href ? "active" : ""}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
