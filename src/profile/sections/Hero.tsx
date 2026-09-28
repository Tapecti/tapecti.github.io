"use client";

import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { experiences } from "@/data/projects";
import { studio } from "@/data/studio";
import { formatCompact, formatExact, formatPeak } from "@/lib/format";
import { topPeak } from "@/lib/peak";
import { resolveHref, shown } from "@/lib/placeholder";
import { useProfile } from "../context";
import { enter } from "../reveal";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { VerifiedBadge } from "../VerifiedBadge";
import styles from "./Hero.module.css";

export function Hero() {
  const { identity, stats } = useProfile();

  const reporting = experiences.filter((e) => stats[e.id]);
  const visits = reporting.reduce((sum, e) => sum + (stats[e.id]?.visits ?? 0), 0);
  const playing = reporting.reduce((sum, e) => sum + (stats[e.id]?.playing ?? 0), 0);
  const peak = topPeak(stats);
  const robloxHref = resolveHref(profile.robloxProfile);

  return (
    <section className={styles.hero} aria-labelledby="profile-name">
      <div className={`container ${styles.grid}`}>
        <div className={styles.stage} {...enter()}>
          {identity.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatar} src={identity.avatar} alt={`${identity.displayName}'s Roblox avatar`} width={720} height={720} />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {identity.displayName.slice(0, 1)}
            </span>
          )}
        </div>

        <div className={styles.profile}>
          <h1 id="profile-name" className={styles.name} {...enter(1)}>
            {robloxHref ? (
              <a href={robloxHref} target="_blank" rel="noopener noreferrer" className={styles.nameLink}>
                {identity.displayName}
                <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
              </a>
            ) : (
              <span>{identity.displayName}</span>
            )}
            {identity.verified && <VerifiedBadge className={styles.verified} label="Verified Roblox account" />}
          </h1>
          <p className={styles.handle} {...enter(2)}>
            <a href={robloxHref} target="_blank" rel="noopener noreferrer" className={styles.handleLink}>
              @{identity.username}
              <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
            </a>
          </p>
          <p className={styles.role} {...enter(3)}>
            {site.role}
          </p>
          {studio && (
            <p className={styles.studioLine} {...enter(3)}>
              <a href="#studio" className={styles.studio}>
                {studio.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={studio.logo} alt="" width={20} height={14} />
                )}
                {studio.name}
              </a>
            </p>
          )}

          <div className={styles.actions} {...enter(4)}>
            <a href="#contact" className="button button-primary">
              Contact
            </a>
            {robloxHref && (
              <a href={robloxHref} target="_blank" rel="noopener noreferrer" className="button button-secondary">
                Roblox profile<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>

          <dl className={styles.stats} {...enter(5)}>
            <div>
              <dt>Games shipped</dt>
              <dd>{experiences.length}</dd>
            </div>
            {peak && (
              <div>
                <dt>Peak CCU</dt>
                <dd>{formatPeak(peak)}</dd>
              </div>
            )}
            {reporting.length > 0 && (
              <div>
                <dt>Visits</dt>
                <dd>{formatCompact(visits)}</dd>
              </div>
            )}
            {playing > 0 && (
              <div>
                <dt>{site.liveMetrics ? "Playing now" : "Playing"}</dt>
                <dd>
                  <AnimatedNumber value={playing} />
                </dd>
              </div>
            )}
          </dl>
          <p className="visually-hidden">
            {reporting.length > 0 && `${formatExact(visits)} total visits across ${reporting.length} experiences.`}
          </p>
        </div>
      </div>
    </section>
  );
}
