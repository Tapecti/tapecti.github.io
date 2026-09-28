import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { experiences } from "@/data/projects";
import { formatCompact, formatExact } from "@/lib/format";
import { renderOgImage, type Figure } from "@/lib/og";
import { peakFor, topPeak } from "@/lib/peak";
import { getProfileData } from "@/lib/profile-data";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return [{ id: "profile.png" }, ...experiences.map((e) => ({ id: `${e.id}.png` }))];
}

/** Share images from real Roblox data, so they never drift from the site. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: file } = await params;
  const id = file.replace(/\.png$/, "");
  const data = await getProfileData();
  const all = data.stats.experiences;
  const owner = {
    name: data.user?.displayName ?? profile.displayName,
    verified: data.user?.verified ?? false,
    headshot: data.user?.headshot,
  };

  if (id === "profile") {
    const reporting = experiences.filter((e) => all[e.id]);
    const visits = reporting.reduce((sum, e) => sum + (all[e.id]?.visits ?? 0), 0);
    const peak = topPeak(all);
    const figures: Figure[] = [{ value: String(experiences.length), label: "Games shipped" }];
    if (reporting.length > 0) figures.push({ value: formatCompact(visits), label: "Visits" });
    if (peak) figures.push({ value: `${formatExact(peak.value)}${peak.atLeast ? "+" : ""}`, label: "Peak CCU" });

    return renderOgImage({
      kind: "profile",
      name: owner.name,
      handle: data.user?.name ?? profile.robloxUsername,
      role: site.role,
      verified: owner.verified,
      avatar: data.user?.avatar,
      figures,
    });
  }

  const experience = experiences.find((e) => e.id === id);
  if (!experience) return new Response("Not found", { status: 404 });
  const stats = all[experience.id];
  const peak = peakFor(experience, all);

  // The two figures that say most about a game: its reach, then its record or its reception.
  const figures: Figure[] = [];
  if (stats) figures.push({ value: formatCompact(stats.visits), label: "Visits" });
  if (peak) {
    figures.push({ value: `${formatExact(peak.value)}${peak.atLeast ? "+" : ""}`, label: "Peak CCU" });
  } else if (stats?.likes !== undefined && stats.dislikes !== undefined && stats.likes + stats.dislikes > 0) {
    figures.push({ value: `${Math.round((stats.likes / (stats.likes + stats.dislikes)) * 100)}%`, label: "Liked" });
  }

  return renderOgImage({
    kind: "experience",
    title: experience.title,
    image: experience.images?.[0]?.src.startsWith("http") ? experience.images[0].src : stats?.images[0],
    owner,
    role: experience.role,
    publisher: experience.groupId ? data.groups[experience.groupId]?.name : undefined,
    figures,
  });
}
