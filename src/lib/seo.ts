import { site } from "@/config/site";
import { resolveHref } from "./placeholder";

/**
 * Where the site lives, including any base path, with a trailing slash so
 * relative paths join onto it instead of replacing it.
 */
export function siteUrl(): URL {
  const configured = resolveHref(site.url);
  const base = configured ?? `http://localhost:${process.env.PORT ?? 3000}`;
  return new URL(base.endsWith("/") ? base : `${base}/`);
}
