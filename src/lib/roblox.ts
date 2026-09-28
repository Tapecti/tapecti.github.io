/**
 * Roblox public data, server-side only (Roblox endpoints send no CORS headers).
 * Every call fails soft: missing data is simply absent and callers never
 * substitute values. Rate limits and server errors are retried first, since
 * Roblox throttles bursts and a single refusal shouldn't blank out the page.
 */

const TIMEOUT_MS = 6000;
const RETRY_DELAYS_MS = [600, 1800];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate },
      });
      if (response.ok) return (await response.json()) as T;
      // Only throttling and server faults are worth another try; anything else won't change.
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= RETRY_DELAYS_MS.length) return null;
    } catch {
      if (attempt >= RETRY_DELAYS_MS.length) return null;
    }
    await sleep(RETRY_DELAYS_MS[attempt]!);
  }
}

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* ── Experiences ─────────────────────────────────────────── */

export type UniverseStats = {
  universeId: string;
  /** The description as written on Roblox, line breaks intact. */
  description?: string;
  playing: number;
  visits: number;
  favorites?: number;
  likes?: number;
  dislikes?: number;
  created?: string;
  updated?: string;
  maxPlayers?: number;
  genre?: string;
  creator?: { id: number; name: string; type: string; verified: boolean };
  /** Game thumbnails in the order set on Roblox. */
  images: string[];
};

type GamesResponse = {
  data?: Array<{
    id?: unknown;
    description?: unknown;
    playing?: unknown;
    visits?: unknown;
    favoritedCount?: unknown;
    created?: unknown;
    updated?: unknown;
    maxPlayers?: unknown;
    genre_l1?: unknown;
    creator?: { id?: unknown; name?: unknown; type?: unknown; hasVerifiedBadge?: unknown };
  }>;
};
type VotesResponse = { data?: Array<{ id?: unknown; upVotes?: unknown; downVotes?: unknown }> };
type GameThumbsResponse = {
  data?: Array<{ universeId?: unknown; thumbnails?: Array<{ state?: unknown; imageUrl?: unknown }> }>;
};

export async function fetchUniverseStats(universeIds: string[], revalidateSeconds: number): Promise<Map<string, UniverseStats>> {
  const result = new Map<string, UniverseStats>();
  const ids = universeIds.filter((id) => /^\d+$/.test(id)).slice(0, 100);
  if (ids.length === 0) return result;
  const list = ids.join(",");

  const [games, votes, thumbs] = await Promise.all([
    getJson<GamesResponse>(`https://games.roblox.com/v1/games?universeIds=${list}`, revalidateSeconds),
    getJson<VotesResponse>(`https://games.roblox.com/v1/games/votes?universeIds=${list}`, revalidateSeconds),
    getJson<GameThumbsResponse>(
      `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${list}&countPerUniverse=10&defaults=true&size=768x432&format=Png&isCircular=false`,
      3600,
    ),
  ]);

  for (const game of games?.data ?? []) {
    if ((typeof game.id !== "number" && typeof game.id !== "string") || !isNum(game.playing) || !isNum(game.visits)) continue;
    const universeId = String(game.id);
    const c = game.creator;
    result.set(universeId, {
      universeId,
      description: typeof game.description === "string" && game.description.trim() ? game.description.trim() : undefined,
      playing: game.playing,
      visits: game.visits,
      favorites: isNum(game.favoritedCount) ? game.favoritedCount : undefined,
      created: typeof game.created === "string" ? game.created : undefined,
      updated: typeof game.updated === "string" ? game.updated : undefined,
      maxPlayers: isNum(game.maxPlayers) ? game.maxPlayers : undefined,
      genre: typeof game.genre_l1 === "string" && game.genre_l1 ? game.genre_l1 : undefined,
      creator:
        c && isNum(c.id) && typeof c.name === "string"
          ? { id: c.id, name: c.name, type: String(c.type ?? ""), verified: c.hasVerifiedBadge === true }
          : undefined,
      images: [],
    });
  }

  for (const vote of votes?.data ?? []) {
    const entry = result.get(String(vote.id));
    if (entry && isNum(vote.upVotes)) entry.likes = vote.upVotes;
    if (entry && isNum(vote.downVotes)) entry.dislikes = vote.downVotes;
  }

  for (const item of thumbs?.data ?? []) {
    const entry = result.get(String(item.universeId));
    if (!entry) continue;
    entry.images = (item.thumbnails ?? [])
      .filter((t) => t.state === "Completed" && typeof t.imageUrl === "string")
      .map((t) => t.imageUrl as string);
  }

  return result;
}

/* ── Profile ─────────────────────────────────────────────── */

export type RobloxUser = {
  id: number;
  name: string;
  displayName: string;
  verified: boolean;
  avatar?: string;
  headshot?: string;
};

type ThumbResponse = { data?: Array<{ targetId?: unknown; state?: unknown; imageUrl?: unknown }> };

const firstImage = (res: ThumbResponse | null) => {
  const item = res?.data?.find((d) => d.state === "Completed" && typeof d.imageUrl === "string");
  return item ? (item.imageUrl as string) : undefined;
};

export async function fetchUser(userId: string, revalidateSeconds: number): Promise<RobloxUser | null> {
  if (!/^\d+$/.test(userId)) return null;
  const [user, avatar, headshot] = await Promise.all([
    getJson<{ id?: unknown; name?: unknown; displayName?: unknown; hasVerifiedBadge?: unknown }>(
      `https://users.roblox.com/v1/users/${userId}`,
      revalidateSeconds,
    ),
    getJson<ThumbResponse>(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
      revalidateSeconds,
    ),
    getJson<ThumbResponse>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
      revalidateSeconds,
    ),
  ]);
  if (!user || !isNum(user.id) || typeof user.name !== "string") return null;
  return {
    id: user.id,
    name: user.name,
    displayName: typeof user.displayName === "string" ? user.displayName : user.name,
    verified: user.hasVerifiedBadge === true,
    avatar: firstImage(avatar),
    headshot: firstImage(headshot),
  };
}

export type RobloxPerson = {
  id: number;
  name: string;
  displayName: string;
  verified: boolean;
  headshot?: string;
  followers?: number;
};

/** Several people at once: a profile and follower count each, one batch for their headshots. */
export async function fetchPeople(userIds: number[], revalidateSeconds: number): Promise<Map<number, RobloxPerson>> {
  const result = new Map<number, RobloxPerson>();
  const ids = [...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (ids.length === 0) return result;

  const [users, followers, headshots] = await Promise.all([
    Promise.all(
      ids.map((id) =>
        getJson<{ id?: unknown; name?: unknown; displayName?: unknown; hasVerifiedBadge?: unknown; isBanned?: unknown }>(
          `https://users.roblox.com/v1/users/${id}`,
          revalidateSeconds,
        ),
      ),
    ),
    Promise.all(ids.map((id) => getJson<{ count?: unknown }>(`https://friends.roblox.com/v1/users/${id}/followers/count`, revalidateSeconds))),
    getJson<ThumbResponse>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(",")}&size=420x420&format=Png&isCircular=false`,
      revalidateSeconds,
    ),
  ]);

  for (const user of users) {
    if (!user || !isNum(user.id) || typeof user.name !== "string" || user.isBanned === true) continue;
    result.set(user.id, {
      id: user.id,
      name: user.name,
      displayName: typeof user.displayName === "string" ? user.displayName : user.name,
      verified: user.hasVerifiedBadge === true,
    });
  }

  ids.forEach((id, i) => {
    const person = result.get(id);
    const count = followers[i]?.count;
    if (person && isNum(count)) person.followers = count;
  });

  for (const shot of headshots?.data ?? []) {
    const person = result.get(Number(shot.targetId));
    if (person && shot.state === "Completed" && typeof shot.imageUrl === "string") person.headshot = shot.imageUrl;
  }

  return result;
}

/* ── Groups ──────────────────────────────────────────────── */

export type RobloxGroup = {
  id: number;
  name: string;
  verified: boolean;
  memberCount?: number;
  ownerId?: number;
  icon?: string;
  /** The user's rank in this group, as named by the group. */
  rank?: { name: string; value: number };
};

type GroupsBatchResponse = {
  data?: Array<{ id?: unknown; name?: unknown; hasVerifiedBadge?: unknown; owner?: { id?: unknown; type?: unknown } | null }>;
};
type RolesResponse = {
  data?: Array<{
    group?: { id?: unknown; name?: unknown; memberCount?: unknown; hasVerifiedBadge?: unknown };
    role?: { name?: unknown; rank?: unknown };
  }>;
};

/**
 * Three requests however many groups there are: one batch for names and
 * owners, the user's memberships for ranks and member counts, and one for
 * icons. Per-group requests got rate limited and dropped groups at random.
 */
export async function fetchGroups(groupIds: number[], userId: string, revalidateSeconds: number): Promise<Map<number, RobloxGroup>> {
  const result = new Map<number, RobloxGroup>();
  const ids = [...new Set(groupIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (ids.length === 0) return result;

  const [batch, icons, roles] = await Promise.all([
    getJson<GroupsBatchResponse>(`https://groups.roblox.com/v2/groups?groupIds=${ids.join(",")}`, revalidateSeconds),
    getJson<ThumbResponse>(
      `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${ids.join(",")}&size=420x420&format=Png&isCircular=false`,
      revalidateSeconds,
    ),
    /^\d+$/.test(userId)
      ? getJson<RolesResponse>(`https://groups.roblox.com/v2/users/${userId}/groups/roles?includeLocked=false`, revalidateSeconds)
      : Promise.resolve(null),
  ]);

  for (const info of batch?.data ?? []) {
    if (!isNum(info.id) || !ids.includes(info.id) || typeof info.name !== "string") continue;
    result.set(info.id, {
      id: info.id,
      name: info.name,
      verified: info.hasVerifiedBadge === true,
      ownerId: info.owner?.type === "User" && isNum(info.owner.id) ? info.owner.id : undefined,
    });
  }

  // Memberships fill in member counts and ranks, and stand in for any group the batch missed.
  for (const membership of roles?.data ?? []) {
    const g = membership.group;
    if (!g || !isNum(g.id) || !ids.includes(g.id)) continue;
    let group = result.get(g.id);
    if (!group && typeof g.name === "string") {
      group = { id: g.id, name: g.name, verified: g.hasVerifiedBadge === true };
      result.set(g.id, group);
    }
    if (!group) continue;
    if (isNum(g.memberCount)) group.memberCount = g.memberCount;
    if (typeof membership.role?.name === "string" && isNum(membership.role.rank)) {
      group.rank = { name: membership.role.name, value: membership.role.rank };
    }
  }

  for (const icon of icons?.data ?? []) {
    const group = result.get(Number(icon.targetId));
    if (group && icon.state === "Completed" && typeof icon.imageUrl === "string") group.icon = icon.imageUrl;
  }

  return result;
}
