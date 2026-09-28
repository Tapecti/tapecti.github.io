import type { NextConfig } from "next";

/**
 * GitHub Pages serves plain files, so the site builds to static HTML when
 * NEXT_PUBLIC_STATIC_EXPORT is set. A project site lives under /<repo>, which
 * NEXT_PUBLIC_BASE_PATH supplies; a user site or custom domain leaves it empty.
 */
const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  reactStrictMode: true,
  // Directory-style URLs, so /experiences/x/ resolves to a file Pages can serve.
  trailingSlash: true,
  ...(staticExport ? { output: "export" as const } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    // Roblox images load straight from their CDN; there is no optimizer on Pages.
    unoptimized: staticExport,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
  },
};

export default config;
