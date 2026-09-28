import { getJson, isNum } from "./roblox";

/** Totals across every game in the studio's catalog, as the studio's own feed reports them. */
export type StudioStats = {
  playing: number;
  visits: number;
  games: number;
  updatedAt?: string;
};

type Feed = {
  games?: unknown[];
  totals?: { playing?: unknown; visits?: unknown; count?: unknown };
  updatedAt?: unknown;
};

/** Server-side only: the feed sends no CORS headers. Fails soft like the Roblox calls. */
export async function fetchStudioStats(feedUrl: string, revalidateSeconds: number): Promise<StudioStats | null> {
  const feed = await getJson<Feed>(feedUrl, revalidateSeconds);
  const totals = feed?.totals;
  if (!totals || !isNum(totals.playing) || !isNum(totals.visits)) return null;
  return {
    playing: totals.playing,
    visits: totals.visits,
    games: isNum(totals.count) ? totals.count : (feed?.games ?? []).length,
    updatedAt: typeof feed?.updatedAt === "string" ? feed.updatedAt : undefined,
  };
}
