"use client";

import { useEffect, useState } from "react";

/**
 * The current time, or null until mounted. Server and first client render
 * agree (no clock, no time zone), then the visitor's own clock takes over,
 * the way Discord timestamps do.
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/** "4 days ago", "in 2 hours", in the visitor's language. */
export function relativeTime(iso: string, now: number): string | undefined {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return undefined;
  const seconds = (time - now) / 1000;
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === "second") return format.format(Math.round(seconds / size), unit);
  }
  return undefined;
}

const utcDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** A date in the visitor's locale and time zone; a neutral UTC date before mount. */
export function localDate(iso: string, now: number | null): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return now === null ? utcDate.format(date) : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

/** Full local date and time, e.g. "Saturday 12 September 2026 at 16:30". Undefined before mount. */
export function localDateTime(iso: string, now: number | null): string | undefined {
  const date = new Date(iso);
  if (now === null || Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(date);
}
