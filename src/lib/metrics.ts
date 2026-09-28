import { site } from "@/config/site";
import { experiences } from "@/data/projects";
import { fetchUniverseStats, type UniverseStats } from "./roblox";

/**
 * Live experience stats, keyed by experience id. The UI reads this shape and
 * never knows whether it came from Roblox, a cache or a future source.
 *
 *   UI  →  useStats (client)  →  /api/metrics  →  getExperienceStats  →  Roblox
 */
export type StatsPayload = {
  generatedAt: string;
  experiences: Record<string, UniverseStats | undefined>;
};

export async function getExperienceStats(): Promise<StatsPayload> {
  const stats = await fetchUniverseStats(
    experiences.map((e) => e.universeId),
    site.metricsRefreshSeconds,
  );
  return {
    generatedAt: new Date().toISOString(),
    experiences: Object.fromEntries(experiences.map((e) => [e.id, stats.get(e.universeId)])),
  };
}
