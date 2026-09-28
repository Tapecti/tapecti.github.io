"use client";

import { useEffect, useRef, useState, type AnimationEvent, type MouseEvent, type ReactNode } from "react";
import type { Experience } from "@/data/types";
import { formatCompact, formatExact } from "@/lib/format";
import { peakFor } from "@/lib/peak";
import { shown } from "@/lib/placeholder";
import { useProfile } from "./context";
import { Votes } from "./facts";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { localDate, localDateTime, relativeTime, useNow } from "./ui/LocalTime";
import { Tip } from "./ui/Tip";
import { VerifiedBadge } from "./VerifiedBadge";
import styles from "./ExperienceView.module.css";

type Stat = { key: string; label: string; value: ReactNode };

type Props = {
  experience: Experience;
  /** Playing its closing animation; it unmounts when that ends. */
  closing: boolean;
  onClosed: () => void;
};

/** A game, opened over the profile the way Roblox lays out a game page. */
export function ExperienceView({ experience, closing, onClosed }: Props) {
  const { stats, images, group, close } = useProfile();
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const now = useNow();

  const live = stats[experience.id];
  const pictures = images(experience);
  const publisher = group(experience.groupId);
  const description = live?.description ?? shown(experience.description);

  useEffect(() => {
    setSelected(0);
    scrollRef.current?.scrollTo({ top: 0 });
    closeRef.current?.focus({ preventScroll: true });
  }, [experience.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, closing]);

  const onBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget && !closing) close();
  };

  /** The closing animation finishing is what actually takes the window away. */
  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === panelRef.current && closing) onClosed();
  };

  // Roblox's own game-page figures, plus the peak when it is known. Missing figures are left out.
  const figures: Stat[] = [];
  // Dates show the day; hovering gives the local time and how long ago, like a Discord timestamp.
  const dated = (iso: string) => {
    const full = localDateTime(iso, now);
    const ago = now === null ? undefined : relativeTime(iso, now);
    return (
      <Tip label={full && ago ? `${full}, ${ago}` : undefined}>
        <time dateTime={iso}>{localDate(iso, now)}</time>
      </Tip>
    );
  };

  if (live) figures.push({ key: "active", label: "Active", value: <AnimatedNumber value={live.playing} /> });
  const peak = peakFor(experience, stats);
  if (peak) {
    figures.push({ key: "peak", label: "Peak CCU", value: peak.atLeast ? `${formatCompact(peak.value)}+` : formatExact(peak.value) });
  }
  if (live?.favorites !== undefined) figures.push({ key: "favorites", label: "Favorites", value: formatExact(live.favorites) });
  if (live) figures.push({ key: "visits", label: "Visits", value: formatCompact(live.visits) });
  if (live?.created) figures.push({ key: "created", label: "Created", value: dated(live.created) });
  if (live?.updated) figures.push({ key: "updated", label: "Updated", value: dated(live.updated) });
  if (live?.maxPlayers) figures.push({ key: "server", label: "Server Size", value: String(live.maxPlayers) });
  if (live?.genre) figures.push({ key: "genre", label: "Genre", value: live.genre });

  return (
    <div className={styles.backdrop} data-closing={closing || undefined} onMouseDown={onBackdrop}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-title"
        onAnimationEnd={onAnimationEnd}
      >
        <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className={styles.scroll} ref={scrollRef}>
          <div className={styles.top}>
            <div>
              <div className={styles.art}>
                {pictures[selected] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pictures[selected]} alt={`${experience.title} on Roblox`} decoding="async" data-fade="" />
                ) : (
                  <span className={styles.fallback}>{experience.title}</span>
                )}
              </div>

              {pictures.length > 1 && (
                <div className={styles.thumbs} role="group" aria-label="Images">
                  {pictures.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={styles.thumb}
                      aria-pressed={i === selected}
                      aria-label={`Show image ${i + 1} of ${pictures.length}`}
                      onClick={() => setSelected(i)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading="lazy" data-fade="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.info}>
              <h2 id="experience-title" className={styles.title}>
                {experience.title}
              </h2>

              {publisher && (
                <p className={styles.by}>
                  By{" "}
                  <a href={`https://www.roblox.com/communities/${publisher.id}`} target="_blank" rel="noopener noreferrer">
                    {publisher.name}
                    <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
                  </a>
                  {publisher.verified && <VerifiedBadge className={styles.verified} label="Verified group" />}
                </p>
              )}
              {shown(experience.role) && <p className={styles.role}>{experience.role}</p>}

              <div className={styles.actions}>
                <a href={experience.placeUrl} target="_blank" rel="noopener noreferrer" className={`button button-primary ${styles.play}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12.1-7.5a1 1 0 0 0 0-1.7L8.52 3.65A1 1 0 0 0 7 4.5Z" />
                  </svg>
                  Play on Roblox<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                {live && <Votes stats={live} className={styles.votes} />}
              </div>
            </div>
          </div>

          {description && (
            <section className={styles.about} aria-labelledby="experience-description">
              <h3 id="experience-description" className={styles.heading}>
                Description
              </h3>
              <p className={styles.description}>{description}</p>
            </section>
          )}

          {figures.length > 0 && (
            <dl className={styles.stats}>
              {figures.map((figure) => (
                <div key={figure.key}>
                  <dt>{figure.label}</dt>
                  <dd>{figure.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
