import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { basePath } from "@/lib/paths";
import { siteUrl } from "@/lib/seo";
import "@/styles/globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
/** Used only inside code excerpts. */
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: site.title, template: `%s, ${profile.displayName}` },
  description: site.description,
  applicationName: profile.displayName,
  creator: profile.displayName,
  robots: { index: true, follow: true },
  icons: {
    icon: { url: `${basePath}/icon.png`, type: "image/png", sizes: "64x64" },
    apple: { url: `${basePath}/apple-icon.png`, type: "image/png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f2f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1013" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Runs before first paint: applies a saved theme choice so there is no flash,
 * and marks that JavaScript is available so scroll entrances may hide content.
 */
const headScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")d.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
