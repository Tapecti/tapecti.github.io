import { renderIcon } from "@/lib/icon";

export const dynamic = "force-static";
export const revalidate = 3600;

/** A route rather than app/icon.tsx: a static export saves that without an extension, and Pages then serves it untyped. */
export function GET() {
  return renderIcon(64, 14);
}
