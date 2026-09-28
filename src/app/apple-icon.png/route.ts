import { renderIcon } from "@/lib/icon";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Square: iOS rounds home-screen icons itself. */
export function GET() {
  return renderIcon(180, 0);
}
