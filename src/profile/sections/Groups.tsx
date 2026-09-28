"use client";

import type { MouseEvent } from "react";
import { experiences } from "@/data/projects";
import type { Experience } from "@/data/types";
import { formatExact } from "@/lib/format";
import { experiencePath } from "@/lib/paths";
import type { RobloxGroup } from "@/lib/roblox";
import { useProfile } from "../context";
import { reveal } from "../reveal";
import { VerifiedBadge } from "../VerifiedBadge";
import { SectionHead } from "./SectionHead";
import styles from "./Groups.module.css";

type Row = { info: RobloxGroup; games: Experience[]; visits: number };

export function Groups() {
  const { data, group, stats, images, open } = useProfile();
  const visitsOf = (experience: Experience) => stats[experience.id]?.visits ?? 0;

  // Every group a game was published under, biggest body of work first.
  const rows = [...new Set(experiences.flatMap((e) => (e.groupId ? [e.groupId] : [])))]
    .flatMap((id): Row[] => {
      const info = group(id);
      if (!info) return [];
      const games = experiences.filter((e) => e.groupId === id).sort((a, b) => visitsOf(b) - visitsOf(a));
      return [{ info, games, visits: games.reduce((sum, e) => sum + visitsOf(e), 0) }];
    })
    .sort((a, b) => b.visits - a.visits);
  if (rows.length === 0) return null;

  const onOpen = (id: string) => (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(id);
  };

  return (
    <section id="groups" className={styles.section} aria-labelledby="groups-title">
      <div className="container">
        <SectionHead id="groups-title" title="Groups" detail="Every studio I have shipped with" />
        <ul className={styles.list}>
          {rows.map(({ info, games }) => {
            // Other people ship under these groups too, so show the rank Roblox reports, not a role.
            // A renamed top rank (e.g. "Holder") still reads as Owner when you own the group.
            const isOwner = data.user && info.ownerId === data.user.id;
            const rank = isOwner ? "Owner" : info.rank?.name;
            const href = `https://www.roblox.com/communities/${info.id}`;

            return (
              <li key={info.id} className={styles.group} {...reveal()}>
                <div className={styles.head}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={styles.logo} tabIndex={-1} aria-hidden="true">
                    {info.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={info.icon} alt="" width={96} height={96} loading="lazy" data-fade="" />
                    )}
                  </a>

                  <div className={styles.main}>
                    <h3 className={styles.name}>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {info.name}
                        <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
                      </a>
                      {info.verified && <VerifiedBadge className={styles.verified} label="Verified group" />}
                    </h3>
                    {info.memberCount !== undefined && <p className={styles.meta}>{formatExact(info.memberCount)} members</p>}
                  </div>

                  <dl className={styles.facts}>
                    {rank && (
                      <div>
                        <dt>Group rank</dt>
                        <dd>{rank}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Games</dt>
                      <dd>{games.length}</dd>
                    </div>
                  </dl>
                </div>

                <ul className={styles.games} aria-label={`Games with ${info.name}`}>
                  {games.map((experience) => {
                    const src = images(experience)[0];
                    return (
                      <li key={experience.id}>
                        <a href={experiencePath(experience.id)} onClick={onOpen(experience.id)} className={styles.game}>
                          <span className={styles.gameArt}>
                            {src && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={src} alt="" loading="lazy" data-fade="" />
                            )}
                          </span>
                          <span className={styles.gameTitle}>{experience.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
