const exact = new Intl.NumberFormat("en");
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const oneDecimal = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

/** 5255 → "5,255". */
export function formatExact(value: number): string {
  return exact.format(Math.round(value));
}

/** 13658902 → "13.7M". */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** 13658902 → "13.7 million"; values under a million stay exact. */
export function formatWords(value: number): string {
  if (value >= 1e9) return `${oneDecimal.format(value / 1e9)} billion`;
  if (value >= 1e6) return `${oneDecimal.format(value / 1e6)} million`;
  return formatExact(value);
}

/** Peak figure with its qualifier: { 8000, atLeast } → "8K+". */
export function formatPeak(peak: { value: number; atLeast?: boolean }): string {
  return `${compact.format(peak.value)}${peak.atLeast ? "+" : ""}`;
}

const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });

/** ISO date → "September 2026". */
export function formatMonth(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : monthYear.format(date);
}

export function yearOf(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date.getUTCFullYear();
}
