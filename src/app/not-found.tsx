import type { Metadata } from "next";
import { profile } from "@/config/profile";
import { homePath } from "@/lib/paths";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: { absolute: `Page not found, ${profile.displayName}` },
  robots: { index: false },
};

/** Shown for any address that isn't the profile or one of its games. */
export default function NotFound() {
  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>This page doesn&apos;t exist.</h1>
        <p className={styles.text}>The link may be mistyped, or the game has been removed from the profile.</p>
        <p className={styles.actions}>
          <a href={homePath} className="button button-primary">
            Back to {profile.displayName}&apos;s profile
          </a>
        </p>
      </div>
    </main>
  );
}
