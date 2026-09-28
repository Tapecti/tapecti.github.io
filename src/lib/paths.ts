/**
 * URLs inside the site. Plain anchors and history calls need the base path
 * spelled out, since only the framework's own links get it for free, and the
 * trailing slash matches the exported folder for each page.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const homePath = `${basePath}/`;

export const experiencePath = (id: string) => `${basePath}/experiences/${id}/`;

/** The experience id in a pathname, or null for the profile itself. */
export function idFromPathname(pathname: string): string | null {
  const path = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const match = /^\/experiences\/([^/]+)\/?$/.exec(path);
  return match ? match[1]! : null;
}
