import { experiences } from "@/data/projects";
import type { Experience } from "@/data/types";
import type { UniverseStats } from "./roblox";

export type PeakFigure = { value: number; atLeast?: boolean };
type Stats = Record<string, UniverseStats | undefined>;

/**
 * Peak CCU can never be lower than what is live right now. The stated peak
 * is the floor; a game playing above it raises its peak, so the profile
 * never shows more players in a game than its record.
 */
function raisedPeak(experience: Experience, stats: Stats): PeakFigure | undefined {
  const stated = experience.peakCCU;
  const live = stats[experience.id]?.playing ?? 0;
  if (stated && stated.value >= live) return stated;
  return live > 0 ? { value: live } : undefined;
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
