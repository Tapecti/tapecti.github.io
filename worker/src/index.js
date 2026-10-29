/**
 * Live Roblox figures for the portfolio, and the peak it remembers.
 *
 * Roblox's API sends no CORS headers, so a page on tapecti.com cannot read it
 * directly. This relays the two calls the site needs and adds that one header.
 * It holds no keys and only ever reads public game stats.
 *
 * Roblox publishes how many are playing right now, never the highest there
 * has ever been, so the peak is this worker's own record: a cron samples every
 * game every few minutes and keeps the largest figure it has ever seen. The
 * site's own stated peaks are the floor, so a record set before this existed
 * is never lost.
 *
 * GET /stats?universeIds=1,2,3  ->  { generatedAt, universes: { id: { playing, visits, peak, ... } } }
 */

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?tapecti\.com$/, /^https:\/\/tapecti\.github\.io$/, /^http:\/\/localhost:\d+$/];
/** Enough for every game on the site, and a cap so this can't be used as a general proxy. */
const MAX_IDS = 40;
/** Seconds the edge keeps a reply. Short enough to feel live, long enough to shield Roblox from bursts. */
const CACHE_SECONDS = 20;
/** One key holds the watched games and their records, so a sample is one read and, rarely, one write. */
const STATE_KEY = "state";

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
async function roblox(url, ttl = CACHE_SECONDS) {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, cf: { cacheTtl: ttl, cacheEverything: true } });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

/** Current figures for a set of universes, keyed by universe id. */
async function sample(ids, ttl) {
  const list = ids.join(",");
  const [games, votes] = await Promise.all([
    roblox(`https://games.roblox.com/v1/games?universeIds=${list}`, ttl),
    roblox(`https://games.roblox.com/v1/games/votes?universeIds=${list}`, ttl),
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
  return universes;
}

const readState = async (env) => (await env.PEAKS?.get(STATE_KEY, "json")) ?? { watching: [], peaks: {} };

/**
 * Raises any record the sample beats and remembers which games to watch.
 * Written only when something actually changed, to stay well inside the free
 * plan's daily writes.
 */
async function recordPeaks(env, state, universes, ids) {
  const peaks = { ...state.peaks };
  let changed = false;
  for (const [universeId, live] of Object.entries(universes)) {
    if (typeof live.playing !== "number") continue;
    if (live.playing > (peaks[universeId] ?? 0)) {
      peaks[universeId] = live.playing;
      changed = true;
    }
  }

  const watching = ids ? [...new Set([...state.watching, ...ids])].slice(0, MAX_IDS) : state.watching;
  if (watching.length !== state.watching.length) changed = true;

  if (changed && env.PEAKS) await env.PEAKS.put(STATE_KEY, JSON.stringify({ watching, peaks, savedAt: new Date().toISOString() }));
  return peaks;
}

export default {
  async fetch(request, env, ctx) {
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

    const [state, universes] = await Promise.all([readState(env), sample(ids, CACHE_SECONDS)]);
    // Nothing readable from Roblox: say so, so the page keeps the figures it already has.
    if (Object.keys(universes).length === 0) return json({ error: "Roblox unavailable" }, origin, 502);

    // A visit is also a sample; the page never waits for the record to be written.
    const peaks = { ...state.peaks };
    for (const [universeId, live] of Object.entries(universes)) {
      if (typeof live.playing === "number" && live.playing > (peaks[universeId] ?? 0)) peaks[universeId] = live.playing;
      const peak = peaks[universeId];
      if (peak !== undefined) live.peak = peak;
    }
    ctx.waitUntil(recordPeaks(env, state, universes, ids));

    return json({ generatedAt: new Date().toISOString(), universes }, origin);
  },

  /** The cron: samples every watched game so a peak set with nobody on the page is still caught. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const state = await readState(env);
        if (state.watching.length === 0) return;
        const universes = await sample(state.watching, 0);
        if (Object.keys(universes).length > 0) await recordPeaks(env, state, universes, null);
      })(),
    );
  },
};
