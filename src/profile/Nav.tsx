"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./context";
import { profile } from "@/config/profile";
import { studio } from "@/data/studio";
import { resolveHref } from "@/lib/placeholder";
import { ThemeToggle } from "./ThemeToggle";
import { VerifiedBadge } from "./VerifiedBadge";
import styles from "./Nav.module.css";

export function Nav({ hasCreations }: { hasCreations: boolean }) {
  const { identity } = useProfile();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#experiences", label: "Experiences" },
    ...(studio ? [{ href: "#studio", label: "Studio" }] : []),
    { href: "#groups", label: "Groups" },
    ...(hasCreations ? [{ href: "#creations", label: "Creations" }] : []),
  ];

  return (
    <header className={styles.nav} data-scrolled={scrolled || undefined}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.identity}>
          <a href={resolveHref(profile.robloxProfile) ?? "#top"} target="_blank" rel="noopener noreferrer" className={styles.identityLink}>
            {identity.headshot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.headshot} src={identity.headshot} alt="" width={32} height={32} />
            )}
            <span className={styles.name}>{identity.displayName}</span>
            <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
          </a>
          {identity.verified && <VerifiedBadge className={styles.verified} label="Verified Roblox account" />}
        </div>

        <nav aria-label="Profile sections" className={styles.links}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
          <a href="#contact" className={`button button-primary ${styles.cta}`}>
            Contact
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
