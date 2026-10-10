import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/** robots.txt - public marketing pages are crawlable, the app is not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/safety", "/privacy", "/terms", "/sign-in"],
        disallow: [
          "/api/",
          "/auth/",
          "/admin",
          "/home",
          "/discover",
          "/nearby",
          "/messages",
          "/matches",
          "/liked-you",
          "/top-matches",
          "/profile",
          "/u/",
          "/onboarding",
          "/notifications",
          "/upgrade",
          "/verify",
          "/create",
          "/posts/",
          "/plans",
          "/events",
          "/heatmap",
          "/feedback",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
