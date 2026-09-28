"use client";

import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { resolveHref } from "@/lib/placeholder";
import { useProfile } from "../context";
import styles from "./Footer.module.css";

export function Footer() {
  const { identity } = useProfile();
  const links = [
    { label: "Discord", href: resolveHref(profile.discordUrl) },
    { label: "Roblox", href: resolveHref(profile.robloxProfile) },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          <p className={styles.owner}>
            {links[1] ? (
              <a href={links[1].href} target="_blank" rel="noopener noreferrer" className={styles.name}>
                {identity.displayName}
                <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
              </a>
            ) : (
              <span className={styles.name}>{identity.displayName}</span>
            )}
            <span>{new Date().getFullYear()}</span>
          </p>

          <p className={styles.note}>{site.metricsNote}</p>

          <nav aria-label="Elsewhere" className={styles.links}>
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ))}
            <a href="#top">Back to top</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
