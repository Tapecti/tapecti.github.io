import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { experiences } from "@/data/projects";
import { siteUrl } from "./seo";

/**
 * Structured data, so a search engine reads the page as a person with a body
 * of work rather than as text that happens to mention Roblox. Only facts
 * already on the page, and only ones that stay true: live figures go stale in
 * an index, so they are left out.
 */
export function personSchema() {
  const base = siteUrl().toString();
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: profile.robloxUsername,
      url: base,
      jobTitle: `Roblox ${site.role}`,
      description: `${profile.displayName} is a verified Roblox ${site.role.toLowerCase()} who scripts the games listed here.`,
      // The accounts that prove this is the same person elsewhere.
      sameAs: [profile.robloxProfile, `https://github.com/${profile.username}`],
      knowsAbout: ["Roblox", "Roblox Studio", "Luau", "Game scripting", "Game development"],
    },
    hasPart: experiences.map((experience) => ({
      "@type": "VideoGame",
      name: experience.title,
      url: new URL(`./experiences/${experience.id}/`, base).toString(),
      gamePlatform: "Roblox",
      ...(experience.placeUrl ? { sameAs: experience.placeUrl } : {}),
      author: { "@type": "Person", name: profile.displayName, url: base },
    })),
  };
}
