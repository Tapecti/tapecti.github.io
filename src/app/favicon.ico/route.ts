import { renderIco } from "@/lib/icon";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Browsers and search engines still ask for /favicon.ico before reading the page's icon links. */
export async function GET() {
  return new Response(new Blob([await renderIco(48, 11)]), { headers: { "Content-Type": "image/x-icon" } });
}
