/**
 * Live Roblox figures for the portfolio.
 *
 * Roblox's API sends no CORS headers, so a page on tapecti.com cannot read it
 * directly. This relays the two calls the site needs and adds that one header.
 * It holds no keys and only ever reads public game stats.
 *
 * GET /stats?universeIds=1,2,3  ->  { generatedAt, universes: { id: {...} } }
 */

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?tapecti\.com$/, /^https:\/\/tapecti\.github\.io$/, /^http:\/\/localhost:\d+$/];
/** Enough for every game on the site, and a cap so this can't be used as a general proxy. */
const MAX_IDS = 40;
/** Seconds the edge keeps a reply. Short enough to feel live, long enough to shield Roblox from bursts. */
const CACHE_SECONDS = 20;

const corsFor = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.some((re) => re.test(origin ?? "")) ? origin : "https://tapecti.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin",
});

const json = (body, origin, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      ...corsFor(origin),
    },
  });

/** Roblox, through the edge cache, with anything unreadable treated as simply absent. */
async function roblox(url) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(origin) });
    if (request.method !== "GET") return json({ error: "Use GET" }, origin, 405);

    const url = new URL(request.url);
    if (url.pathname !== "/stats") return json({ error: "Not found" }, origin, 404);

    const ids = (url.searchParams.get("universeIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d{1,20}$/.test(id))
      .slice(0, MAX_IDS);
    if (ids.length === 0) return json({ error: "universeIds required" }, origin, 400);

    const list = ids.join(",");
    const [games, votes] = await Promise.all([
      roblox(`https://games.roblox.com/v1/games?universeIds=${list}`),
      roblox(`https://games.roblox.com/v1/games/votes?universeIds=${list}`),
    ]);

    const universes = {};
    for (const game of games?.data ?? []) {
      if (game?.id === undefined) continue;
      universes[String(game.id)] = {
        playing: game.playing,
        visits: game.visits,
        favorites: game.favoritedCount,
        updated: game.updated,
      };
    }
    for (const vote of votes?.data ?? []) {
      const entry = universes[String(vote?.id)];
      if (!entry) continue;
      entry.likes = vote.upVotes;
      entry.dislikes = vote.downVotes;
    }

    // Nothing readable from Roblox: say so, so the page keeps the figures it already has.
    if (Object.keys(universes).length === 0) return json({ error: "Roblox unavailable" }, origin, 502);
    return json({ generatedAt: new Date().toISOString(), universes }, origin);
  },
};
