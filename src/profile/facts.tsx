"use client";

import type { ReactNode } from "react";
import type { Experience } from "@/data/types";
import { site } from "@/config/site";
import { formatCompact, formatExact, formatMonth } from "@/lib/format";
import { peakFor } from "@/lib/peak";
import type { UniverseStats } from "@/lib/roblox";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import styles from "./facts.module.css";

export type Fact = { key: string; label: ReactNode; value: ReactNode };

/** Share of players who liked the game, from Roblox's up and down votes. */
export function ratingOf(stats: UniverseStats | undefined): number | undefined {
  if (stats?.likes === undefined || stats.dislikes === undefined) return undefined;
  const total = stats.likes + stats.dislikes;
  return total > 0 ? stats.likes / total : undefined;
}

function ThumbUp() {
  return (
    <svg className={styles.thumb} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

function ThumbDown() {
  return (
    <svg className={styles.thumb} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
    </svg>
  );
}

/** Likes and dislikes the way Roblox shows them: thumbs, counts, and the split as a bar. */
export function Votes({ stats, className = "" }: { stats: UniverseStats; className?: string }) {
  const ratio = ratingOf(stats);
  if (ratio === undefined) return null;
  const likes = stats.likes!;
  const dislikes = stats.dislikes!;
  return (
    <span
      className={`${styles.votes} ${className}`}
      role="img"
      aria-label={`${formatExact(likes)} likes, ${formatExact(dislikes)} dislikes (${Math.round(ratio * 100)}% liked)`}
    >
      <span className={styles.count}>
        <ThumbUp />
        {formatCompact(likes)}
      </span>
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className={styles.count}>
        <ThumbDown />
        {formatCompact(dislikes)}
      </span>
    </span>
  );
}

/** The figures that matter, in order. Unknown figures are left out, never estimated. */
export function keyFacts(experience: Experience, allStats: Record<string, UniverseStats | undefined>): Fact[] {
  const facts: Fact[] = [];
  const stats = allStats[experience.id];
  const peak = peakFor(experience, allStats);
  if (peak) {
    facts.push({ key: "peak", label: "Peak CCU", value: peak.atLeast ? `${formatCompact(peak.value)}+` : formatExact(peak.value) });
  }
  if (stats && stats.playing > 0) {
    facts.push({ key: "playing", label: site.liveMetrics ? "Playing now" : "Playing", value: <AnimatedNumber value={stats.playing} /> });
  }
  if (stats) facts.push({ key: "visits", label: "Visits", value: formatCompact(stats.visits) });
  const ratio = ratingOf(stats);
  if (stats && ratio !== undefined) {
    facts.push({
      key: "rating",
      // The vote split sits under the percentage in place of a label.
      label: <Votes stats={stats} />,
      value: `${Math.round(ratio * 100)}%`,
    });
  }
  return facts;
}

/** When the game first went up on Roblox, e.g. "Created July 2026". */
export function createdLine(stats: UniverseStats | undefined): string | undefined {
  const created = formatMonth(stats?.created);
  return created ? `Created ${created}` : undefined;
}
