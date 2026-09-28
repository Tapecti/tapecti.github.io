import type { MetadataRoute } from "next";
import { experiences } from "@/data/projects";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();
  return [
    { url: url("./"), changeFrequency: "daily", priority: 1 },
    ...experiences.map((e) => ({
      url: url(`./experiences/${e.id}/`),
      changeFrequency: "weekly" as const,
      priority: e.featured ? 0.9 : 0.7,
    })),
  ];
}
