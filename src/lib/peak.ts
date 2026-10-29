import { experiences } from "@/data/projects";
import type { Experience } from "@/data/types";
import type { UniverseStats } from "./roblox";

export type PeakFigure = { value: number; atLeast?: boolean };
type Stats = Record<string, UniverseStats | undefined>;

/**
 * Peak CCU can never be lower than what is live right now, nor lower than a
 * figure already reached. Three sources, highest wins: the stated peak, the
 * record the stats worker has sampled since it went up, and the players in
 * the game at this moment.
 */
function raisedPeak(experience: Experience, stats: Stats): PeakFigure | undefined {
  const live = stats[experience.id];
  const best = Math.max(experience.peakCCU?.value ?? 0, live?.peak ?? 0, live?.playing ?? 0);
  if (best <= 0) return undefined;
  // "At least" belonged to the stated figure, and only while it still stands.
  return best === experience.peakCCU?.value ? experience.peakCCU : { value: best };
}

/** The highest peak across every game, and the game that set it. */
export function topPeak(stats: Stats): (PeakFigure & { experience: Experience }) | undefined {
  let best: (PeakFigure & { experience: Experience }) | undefined;
  for (const experience of experiences) {
    const peak = raisedPeak(experience, stats);
    if (peak && (!best || peak.value > best.value)) best = { ...peak, experience };
  }
  return best;
}

/**
 * The peak to show for one game: its stated peak raised by live players, or,
 * for a game with no stated peak, the live count only when it has become the
 * record across all games. Otherwise none, since a live count alone is not a peak.
 */
export function peakFor(experience: Experience, stats: Stats): PeakFigure | undefined {
  if (experience.peakCCU) return raisedPeak(experience, stats);
  const top = topPeak(stats);
  return top?.experience.id === experience.id ? { value: top.value, atLeast: top.atLeast } : undefined;
}
