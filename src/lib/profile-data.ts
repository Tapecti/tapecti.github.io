import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { collaborators } from "@/data/collaborators";
import { experiences } from "@/data/projects";
import { studio as studioConfig } from "@/data/studio";
import { getExperienceStats, type StatsPayload } from "./metrics";
import { fetchGroups, fetchPeople, fetchUser, type RobloxGroup, type RobloxPerson, type RobloxUser, type UniverseStats } from "./roblox";
import { fetchStudioStats, type StudioStats } from "./studio";

export type CollaboratorProfile = RobloxPerson & { discordUrl?: string; current: boolean; highlight: boolean; role: string; about: string };

export type ProfileData = {
  user: RobloxUser | null;
  groups: Record<number, RobloxGroup>;
  /** Current collaborators first, otherwise in the listed order; anyone Roblox can't return is left out. */
  collaborators: CollaboratorProfile[];
  stats: StatsPayload;
  studio: StudioStats | null;
};

const IDENTITY_REVALIDATE = 3600;

/*
 * The last complete answer from Roblox, kept in the repository. If Roblox
 * refuses or times out on a request, that piece falls back to what it last
 * said instead of vanishing from the page. It is only ever real Roblox data,
 * written back whenever every request succeeds. The studio's totals ride along
 * and keep their last good value when the studio's feed doesn't answer.
 */
type Snapshot = {
  savedAt: string;
  user: RobloxUser | null;
  groups: Record<number, RobloxGroup>;
  people: Record<number, RobloxPerson>;
  experiences: Record<string, UniverseStats>;
  studio?: StudioStats | null;
};

const SNAPSHOT_PATH = join(process.cwd(), "roblox-snapshot.json");

async function readSnapshot(): Promise<Snapshot | null> {
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")) as Snapshot;
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot: Snapshot) {
  try {
    await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  } catch {
    // A read-only filesystem just means no refresh this time.
  }
}

/** Everything the profile needs from Roblox, fetched in parallel on the server. */
export async function getProfileData(): Promise<ProfileData> {
  const groupIds = [...new Set(experiences.flatMap((e) => (e.groupId ? [e.groupId] : [])))];
  const personIds = collaborators.map((c) => c.robloxUserId);
  const [liveUser, liveGroups, livePeople, liveStats, liveStudio, snapshot] = await Promise.all([
    fetchUser(profile.robloxUserId, IDENTITY_REVALIDATE),
    fetchGroups(groupIds, profile.robloxUserId, IDENTITY_REVALIDATE),
    fetchPeople(personIds, IDENTITY_REVALIDATE),
    getExperienceStats(),
    studioConfig ? fetchStudioStats(studioConfig.feedUrl, site.metricsRefreshSeconds) : null,
    readSnapshot(),
  ]);

  // Live where Roblox answered, the last good answer where it didn't.
  const user = liveUser ?? snapshot?.user ?? null;
  const groups: Record<number, RobloxGroup> = {};
  for (const id of groupIds) {
    const group = liveGroups.get(id) ?? snapshot?.groups[id];
    if (group) groups[id] = group;
  }
  const studio = liveStudio ?? snapshot?.studio ?? null;
  const people = new Map<number, RobloxPerson>();
  for (const id of personIds) {
    const person = livePeople.get(id) ?? snapshot?.people[id];
    if (person) people.set(id, person);
  }
  const stats: StatsPayload = {
    generatedAt: liveStats.generatedAt,
    experiences: Object.fromEntries(experiences.map((e) => [e.id, liveStats.experiences[e.id] ?? snapshot?.experiences[e.id]])),
  };

  const complete =
    liveUser !== null &&
    groupIds.every((id) => liveGroups.has(id)) &&
    personIds.every((id) => livePeople.has(id)) &&
    experiences.every((e) => liveStats.experiences[e.id]);
  if (complete) {
    await writeSnapshot({
      savedAt: new Date().toISOString(),
      user: liveUser,
      groups: Object.fromEntries(liveGroups),
      people: Object.fromEntries(livePeople),
      experiences: liveStats.experiences as Record<string, UniverseStats>,
      studio,
    });
  }

  return {
    user,
    groups,
    collaborators: collaborators
      .flatMap((c) => {
        const person = people.get(c.robloxUserId);
        if (!person) return [];
        const discordUrl = c.discordUserId ? `https://discord.com/users/${c.discordUserId}` : undefined;
        return [{ ...person, discordUrl, current: c.current === true, highlight: c.highlight === true, role: c.role, about: c.about }];
      })
      .sort((a, b) => Number(b.current) - Number(a.current)),
    stats,
    studio,
  };
}
