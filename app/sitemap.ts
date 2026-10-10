import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/** sitemap.xml - only public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  ) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  return [
    page("/", 1, "weekly"),
    page("/about", 0.8, "monthly"),
    page("/safety", 0.7, "monthly"),
    page("/sign-in", 0.6, "monthly"),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
  ];
}
