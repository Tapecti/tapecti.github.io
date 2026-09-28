/**
 * Content schema for the profile.
 *
 * Anything Roblox can report (players, visits, favorites, votes, dates,
 * thumbnails, group names, logos, ranks) is fetched live and never stored
 * here. This file holds what only you can know.
 *
 * Values in [brackets] are placeholders: visible while developing,
 * never rendered in production.
 */

export type CodeSnippet = {
  filename: string;
  language: "luau";
  /** Keep it to the 10–30 lines that carry the idea. */
  source: string;
  caption?: string;
};

export type Experience = {
  /** URL slug: /experiences/{id} */
  id: string;
  title: string;
  /** One sentence on the game itself. Left out when there's nothing worth saying. */
  description?: string;
  /** Your role on this experience, e.g. "Lead Scripter". */
  role: string;
  /** Roblox universe ID. Enables live stats, thumbnails and the publisher group. */
  universeId: string;
  /** Roblox group the experience is published under. */
  groupId?: number;
  placeUrl: string;
  /** Leads the Experiences section with the most visual weight. */
  featured?: boolean;
  /** Earlier or smaller games: they fill spare showcase slots, otherwise wait under "Show all games". */
  archive?: boolean;
  /**
   * Highest concurrent players. Roblox does not publish peak CCU, so this is
   * the only stored figure. `atLeast` renders a lower bound, e.g. "8K+".
   */
  peakCCU?: { value: number; atLeast?: boolean };
  /** Local screenshots under /public/media. Roblox thumbnails are used when empty. */
  images?: { src: string; alt: string }[];
};

/**
 * The studio you primarily work with. It spans many Roblox groups, so it has
 * its own section rather than a row under Groups. Its totals come from the
 * studio's own feed. Its games aren't relisted.
 */
export type Studio = {
  name: string;
  /** The studio's public page. */
  url: string;
  /** JSON feed of the studio's games and live totals. */
  feedUrl: string;
  logo?: string;
  /** One line on the studio. */
  about?: string;
};

/** Engineering work that isn't a whole game. */
export type Creation = {
  id: string;
  title: string;
  /** One line on what it does. */
  summary: string;
  /** What makes it non-trivial: scale, constraints, design. */
  details: string[];
  /** Experience ids this shipped in. */
  usedIn?: string[];
  code?: CodeSnippet;
  image?: { src: string; alt: string };
};
