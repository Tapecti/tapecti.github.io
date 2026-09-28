"use client";

import { useId, useState, type CSSProperties, type MouseEvent } from "react";
import type { Experience } from "@/data/types";
import { formatCompact, formatMonth } from "@/lib/format";
import { experiencePath } from "@/lib/paths";
import { shown } from "@/lib/placeholder";
import { useProfile } from "../context";
import { createdLine, keyFacts, Votes } from "../facts";
import { GroupLine } from "../GroupLine";
import { reveal } from "../reveal";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { SectionHead } from "./SectionHead";
import styles from "./Experiences.module.css";

/** Plain clicks open the game page in place; modified clicks behave like links. */
function useOpen(id: string) {
  const { open } = useProfile();
  return (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(id);
  };
}

type Variant = "feature" | "tile" | "row";

function Art({ experience, variant }: { experience: Experience; variant: Variant }) {
  const { images } = useProfile();
  const src = images(experience)[0];
  const variantClass = variant === "feature" ? styles.artFeature : variant === "row" ? styles.artRow : "";
  return (
    <span className={`${styles.art} ${variantClass}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading={variant === "feature" ? "eager" : "lazy"} decoding="async" data-fade="" />
      ) : (
        variant !== "row" && <span className={styles.artFallback}>{experience.title}</span>
      )}
    </span>
  );
}

function Feature({ experience }: { experience: Experience }) {
  const { stats } = useProfile();
  const onOpen = useOpen(experience.id);
  const live = stats[experience.id];
  const facts = keyFacts(experience, stats);
  const created = createdLine(live);

  return (
    <article className={styles.feature} aria-labelledby={`exp-${experience.id}`} {...reveal()}>
      <a href={experiencePath(experience.id)} onClick={onOpen} className={styles.featureLink} tabIndex={-1} aria-hidden="true">
        <Art experience={experience} variant="feature" />
      </a>

      <div className={styles.featureBar}>
        <div>
          <GroupLine groupId={experience.groupId} />
          <h3 id={`exp-${experience.id}`} className={styles.title}>
            <a href={experiencePath(experience.id)} onClick={onOpen}>
              {experience.title}
            </a>
          </h3>
          {shown(experience.role) && <p className={styles.role}>{experience.role}</p>}
          {created && <p className={styles.created}>{created}</p>}
        </div>

        {facts.length > 0 && (
          <dl className={styles.stats}>
            {facts.map((fact) => (
              <div key={fact.key}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}

function Tile({ experience, index }: { experience: Experience; index: number }) {
  const { stats } = useProfile();
  const onOpen = useOpen(experience.id);
  const live = stats[experience.id];
  const created = formatMonth(live?.created);

  return (
    <li {...reveal(index % 3)}>
      <a href={experiencePath(experience.id)} onClick={onOpen} className={styles.tile}>
        <Art experience={experience} variant="tile" />
        <span className={styles.tileHead}>
          <span className={styles.tileTitle}>{experience.title}</span>
          {created && <span className={styles.tileDate}>{created}</span>}
        </span>
        {live && (
          <span className={styles.tileMeta}>
            <span className={styles.figures}>
              <span>{formatCompact(live.visits)} visits</span>
              <Playing count={live.playing} className={styles.playing} />
            </span>
            <Votes stats={live} className={styles.votes} />
          </span>
        )}
      </a>
    </li>
  );
}

/** Players in game right now, shown only when someone is. Visits alone undersell a game that is live. */
function Playing({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={className}>
      <AnimatedNumber value={count} /> playing
    </span>
  );
}

/** A compact line for the full catalogue: small art, title, date, figures. */
function Row({ experience, index }: { experience: Experience; index: number }) {
  const { stats } = useProfile();
  const onOpen = useOpen(experience.id);
  const live = stats[experience.id];

  return (
    <li style={{ "--i": Math.min(index, 12) } as CSSProperties}>
      <a href={experiencePath(experience.id)} onClick={onOpen} className={styles.row}>
        <Art experience={experience} variant="row" />
        <span className={styles.rowName}>
          <span className={styles.rowTitle}>{experience.title}</span>
          {live?.created && <span className={styles.rowDate}>{formatMonth(live.created)}</span>}
        </span>
        {live && (
          <>
            <span className={styles.rowFigures}>
              <span className={styles.rowVisits}>{formatCompact(live.visits)} visits</span>
              <Playing count={live.playing} className={styles.playing} />
            </span>
            <Votes stats={live} className={styles.rowVotes} />
          </>
        )}
      </a>
    </li>
  );
}

export function Experiences() {
  const { ordered, showcaseSize } = useProfile();
  const [showAll, setShowAll] = useState(false);
  const listId = useId();

  const [lead, ...rest] = ordered.slice(0, showcaseSize);
  const more = ordered.slice(showcaseSize);

  return (
    <section id="experiences" className={styles.section} aria-labelledby="experiences-title">
      <div className="container">
        <SectionHead id="experiences-title" title="Experiences" detail="Fully scripted by me." />
        {lead && <Feature experience={lead} />}
        {rest.length > 0 && (
          <ul className={styles.grid} aria-label="More experiences">
            {rest.map((experience, i) => (
              <Tile key={experience.id} experience={experience} index={i} />
            ))}
          </ul>
        )}

        {more.length > 0 && (
          <div className={styles.all} {...reveal()}>
            <button
              type="button"
              className="button button-secondary"
              aria-expanded={showAll}
              aria-controls={listId}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show fewer games" : `Show all ${ordered.length} games`}
            </button>
            <ul id={listId} className={styles.rows} hidden={!showAll} aria-label="Earlier games">
              {more.map((experience, i) => (
                <Row key={experience.id} experience={experience} index={i} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
