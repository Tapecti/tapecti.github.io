import { experiences } from "@/data/projects";
import { formatExact } from "@/lib/format";
import { profile } from "./profile";

/**
 * On a static host the Roblox figures are read when the site is built, not in
 * the visitor's browser, so nothing on the page may call them live.
 */
export const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

export const site = {
  /** Production origin, e.g. "https://example.com". Used for canonical URLs and share images. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "[site_url]",
  role: "Scripter",
  get title() {
    return `${profile.displayName}, ${this.role}`;
  },
  /** Facts only, for search results and link previews. */
  get description() {
    const peak = Math.max(0, ...experiences.map((e) => e.peakCCU?.value ?? 0));
    const record = peak > 0 ? `, a peak of ${formatExact(peak)} concurrent players` : "";
    return `${profile.displayName} is a verified Roblox ${this.role.toLowerCase()}: ${experiences.length} shipped games${record}.`;
  },
  /** Stats are cached server-side and refreshed in the browser at this interval. */
  metricsRefreshSeconds: 60,
  /** Whether the browser may refresh the figures itself. */
  liveMetrics: !staticExport,
  /** How the page describes where its figures come from. */
  get metricsNote() {
    return this.liveMetrics
      ? "Players, visits, votes and groups are live from Roblox."
      : "Players, visits, votes and groups come from Roblox, refreshed every few hours.";
  },
} as const;
