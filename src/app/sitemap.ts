import type { MetadataRoute } from "next";
import { experiences } from "@/data/projects";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();
  // The site is rebuilt with fresh Roblox figures, so every page is as new as this build.
  const lastModified = new Date();
  return [
    { url: url("./"), lastModified, changeFrequency: "daily", priority: 1 },
    ...experiences.map((e) => ({
      url: url(`./experiences/${e.id}/`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: e.featured ? 0.9 : 0.7,
    })),
  ];
}
