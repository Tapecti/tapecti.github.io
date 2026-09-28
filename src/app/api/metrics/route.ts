import { site } from "@/config/site";
import { getExperienceStats } from "@/lib/metrics";

/**
 * Live stats for the experiences listed in src/data. Only those universes are
 * queried, so this is not an open proxy.
 */
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  const payload = await getExperienceStats();
  return Response.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${site.metricsRefreshSeconds}, stale-while-revalidate=${site.metricsRefreshSeconds * 4}`,
    },
  });
}
