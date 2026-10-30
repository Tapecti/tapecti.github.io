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
  /** The title carries the trade, since "Scripter" alone means nothing to a search engine. */
  get titleRole() {
    return `Roblox ${this.role}`;
  },
  get title() {
    return `${profile.displayName}, ${this.titleRole}`;
  },
  /*
   * Facts only, for search results and link previews. Deliberately free of
   * live figures: a search engine keeps a description for months, and a
   * number that was true at the crawl reads as a lie by the time it is shown.
   */
  get description() {
    return `${profile.displayName} is a verified Roblox ${this.role.toLowerCase()}. Every game here is scripted by ${profile.displayName}, with player counts, visits and ratings read live from Roblox.`;
  },
  /*
   * How often the browser asks for figures again. Roblox's own numbers move
   * every 5 to 15 seconds, so half a minute keeps the page close without
   * hammering anything. The stats worker caches for 10 seconds on top.
   */
  metricsRefreshSeconds: 30,
  /*
   * On a static host the figures are baked in at build time, so the browser
   * refreshes them from the stats worker instead: Roblox itself cannot be
   * called from a page, since it sends no CORS headers. Unset means the page
   * shows the build's figures and nothing more.
   */
  statsWorkerUrl: process.env.NEXT_PUBLIC_STATS_WORKER_URL ?? "",
  /** Whether the browser may refresh the figures itself. */
  get liveMetrics() {
    return !staticExport || this.statsWorkerUrl !== "";
  },
  /** How the page describes where its figures come from. */
  get metricsNote() {
    return this.liveMetrics
      ? "Players, visits, votes and groups are live from Roblox."
      : "Players, visits, votes and groups come from Roblox, refreshed every few hours.";
  },
} as const;
