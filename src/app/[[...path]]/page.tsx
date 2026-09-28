import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { experiences } from "@/data/projects";
import type { Experience } from "@/data/types";
import { formatCompact } from "@/lib/format";
import { shown } from "@/lib/placeholder";
import { getProfileData } from "@/lib/profile-data";
import { ProfileApp } from "@/profile/ProfileApp";

type Params = { path?: string[] };

export const dynamicParams = false;

/** Roblox figures in the prerendered HTML are at most this old; the browser refreshes them. */
export const revalidate = 60;

/** The profile, plus a prerendered URL for each experience. */
export function generateStaticParams(): Params[] {
  return [{ path: [] }, ...experiences.map((e) => ({ path: ["experiences", e.id] }))];
}

function resolve(path: string[] = []) {
  if (path.length === 0) return { kind: "profile" as const };
  if (path.length === 2 && path[0] === "experiences") {
    const experience = experiences.find((e) => e.id === path[1]);
    if (experience) return { kind: "experience" as const, experience };
  }
  return null;
}

/** One factual line for a game's link preview, e.g. "Lead Scripter on Driving Test. 13.7M visits, 68% liked." */
async function experienceSummary(experience: Experience): Promise<string> {
  const data = await getProfileData();
  const stats = data.stats.experiences[experience.id];
  const facts: string[] = [];
  if (stats) facts.push(`${formatCompact(stats.visits)} visits`);
  const votes = (stats?.likes ?? 0) + (stats?.dislikes ?? 0);
  if (stats?.likes !== undefined && votes > 0) facts.push(`${Math.round((stats.likes / votes) * 100)}% liked`);
  const lead = `${shown(experience.role) ?? "Scripter"} on ${experience.title}, by ${profile.displayName}.`;
  return facts.length ? `${lead} ${facts.join(", ")}.` : (shown(experience.description) ?? lead);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { path } = await params;
  const route = resolve(path);
  if (!route) return {};

  const url = `/${(path ?? []).join("/")}`;
  const title = route.kind === "experience" ? `${route.experience.title}, ${profile.displayName}` : site.title;
  const description = route.kind === "experience" ? await experienceSummary(route.experience) : site.description;
  const image = route.kind === "experience" ? `/og/${route.experience.id}.png` : "/og/profile.png";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: route.kind === "experience" ? "article" : "profile",
      url,
      siteName: profile.displayName,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { path } = await params;
  const route = resolve(path);
  if (!route) notFound();
  const data = await getProfileData();

  return <ProfileApp data={data} initialExperienceId={route.kind === "experience" ? route.experience.id : undefined} />;
}
