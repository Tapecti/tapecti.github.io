"use client";

import { site } from "@/config/site";
import { studio } from "@/data/studio";
import { formatCompact, formatExact } from "@/lib/format";
import { useProfile } from "../context";
import { reveal } from "../reveal";
import { SectionHead } from "./SectionHead";
import styles from "./Studio.module.css";

/** The studio and its figures. Its games aren't relisted: mine are already under Experiences and Groups. */
export function Studio() {
  const { data } = useProfile();
  const totals = data.studio;
  if (!studio) return null;

  const panels = totals
    ? [
        {
          id: "playing",
          value: formatExact(totals.playing),
          title: site.liveMetrics ? "Playing now" : "Playing",
          detail: `Across all ${totals.games} of the studio's games.`,
        },
        { id: "visits", value: formatCompact(totals.visits), title: "Total visits", detail: "Every game in the studio's catalog." },
        { id: "games", value: formatExact(totals.games), title: "Games", detail: "Live on Roblox." },
      ]
    : [];

  return (
    <section id="studio" className={styles.section} aria-labelledby="studio-title">
      <div className="container">
        <SectionHead id="studio-title" title="Studio" />

        <div className={styles.head} {...reveal()}>
          <a href={studio.url} target="_blank" rel="noopener noreferrer" className={styles.logo} tabIndex={-1} aria-hidden="true">
            {studio.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={studio.logo} alt="" width={96} height={66} loading="lazy" />
            )}
          </a>
          <div>
            <h3 className={styles.name}>
              <a href={studio.url} target="_blank" rel="noopener noreferrer">
                {studio.name}
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </h3>
            {studio.about && <p className={styles.about}>{studio.about}</p>}
          </div>
        </div>

        {panels.length > 0 && (
          <ul className={styles.list}>
            {panels.map((panel, i) => (
              <li key={panel.id} className={styles.panel} {...reveal(i)}>
                <p className={styles.value}>{panel.value}</p>
                <h3 className={styles.title}>{panel.title}</h3>
                <p className={styles.detail}>{panel.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
