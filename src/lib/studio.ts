import { getJson, isNum } from "./roblox";

/** One of the studio's games, as shown rolling past in the studio section. */
export type StudioGame = {
  name: string;
  url: string;
  image: string;
  playing: number;
};

/** Totals across every game in the studio's catalog, as the studio's own feed reports them. */
export type StudioStats = {
  playing: number;
  visits: number;
  games: number;
  /** The busiest games right now, most players first. */
  top?: StudioGame[];
  updatedAt?: string;
};

type FeedGame = { name?: unknown; url?: unknown; thumbnails?: unknown; icon?: unknown; playing?: unknown };
type Feed = {
  games?: FeedGame[];
  totals?: { playing?: unknown; visits?: unknown; count?: unknown };
  updatedAt?: unknown;
};

const TOP_GAMES = 12;

/** The feed is someone else's data: only Roblox game pages and Roblox's image CDN get through. */
const robloxGame = (v: unknown) => (typeof v === "string" && /^https:\/\/www\.roblox\.com\/games\/\d+/.test(v) ? v : undefined);
const robloxImage = (v: unknown) => (typeof v === "string" && /^https:\/\/tr\.rbxcdn\.com\//.test(v) ? v : undefined);

/** "[🔥] My ASMR House 🏠" → "My ASMR House": tags and emoji read as noise at this size. */
const cleanName = (name: string) =>
  name
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

function topGames(games: FeedGame[]): StudioGame[] {
  return games
    .flatMap((g): StudioGame[] => {
      const url = robloxGame(g.url);
      const image = robloxImage(Array.isArray(g.thumbnails) ? g.thumbnails[0] : undefined) ?? robloxImage(g.icon);
      const name = typeof g.name === "string" ? cleanName(g.name) : "";
      return url && image && name && isNum(g.playing) ? [{ name, url, image, playing: g.playing }] : [];
    })
    .sort((a, b) => b.playing - a.playing)
    .slice(0, TOP_GAMES);
}

/** Server-side only: the feed sends no CORS headers. Fails soft like the Roblox calls. */
export async function fetchStudioStats(feedUrl: string, revalidateSeconds: number): Promise<StudioStats | null> {
  const feed = await getJson<Feed>(feedUrl, revalidateSeconds);
  const totals = feed?.totals;
  if (!totals || !isNum(totals.playing) || !isNum(totals.visits)) return null;
  const games = Array.isArray(feed?.games) ? feed.games : [];
  return {
    playing: totals.playing,
    visits: totals.visits,
    games: isNum(totals.count) ? totals.count : games.length,
    top: topGames(games),
    updatedAt: typeof feed?.updatedAt === "string" ? feed.updatedAt : undefined,
  };
}
