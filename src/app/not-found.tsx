import type { Metadata } from "next";
import { profile } from "@/config/profile";
import { homePath } from "@/lib/paths";

export const metadata: Metadata = {
  title: { absolute: `Page not found, ${profile.displayName}` },
  robots: { index: false },
};

/** Shown for any address that isn't the profile or one of its games. Styled in globals.css (see the note there). */
export default function NotFound() {
  return (
    <main className="container not-found">
      <div className="not-found-inner">
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">This page doesn&apos;t exist.</h1>
        <p className="not-found-text">The link may be mistyped, or the game has been removed from the profile.</p>
        <p className="not-found-actions">
          <a href={homePath} className="button button-primary">
            Back to {profile.displayName}&apos;s profile
          </a>
        </p>
      </div>
    </main>
  );
}
