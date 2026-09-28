/** A value like "[site_url]" that hasn't been filled in yet. */
export function isPlaceholder(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "number") return false;
  const trimmed = value.trim();
  return trimmed === "" || (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

export function isConfigured(value: string | number | undefined | null): value is string | number {
  return !isPlaceholder(value);
}

/** Returns a usable href, or undefined when the source value is still a placeholder. */
export function resolveHref(value: string | undefined, kind: "url" | "email" = "url"): string | undefined {
  if (!isConfigured(value)) return undefined;
  if (kind === "email") return `mailto:${value}`;
  try {
    return new URL(value).toString();
  } catch {
    return undefined;
  }
}

/**
 * Unfilled "[placeholder]" content is visible while developing (so you can
 * see what still needs writing) and never rendered in production.
 */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

/** The value to render, or undefined when it's a placeholder that shouldn't be shown. */
export function shown(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value.trim() === "") return undefined;
  return SHOW_PLACEHOLDERS || isConfigured(value) ? value : undefined;
}

/** Keeps list items that should be rendered. */
export function shownList(values: (string | undefined)[] | undefined): string[] {
  return (values ?? []).filter((value): value is string => shown(value) !== undefined);
}
