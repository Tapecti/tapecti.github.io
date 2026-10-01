"use client";

import { useEffect, useRef, type RefObject } from "react";
import { site } from "@/config/site";
import { studio } from "@/data/studio";
import { formatCompact, formatExact } from "@/lib/format";
import type { StudioGame } from "@/lib/studio";
import { useProfile } from "../context";
import { reveal } from "../reveal";
import { SectionHead } from "./SectionHead";
import styles from "./Studio.module.css";

/** Seconds each game takes to roll past, so the pace stays the same however many there are. */
const ROLL_SECONDS_PER_GAME = 4.5;
/** Time constants for gliding to a stop under the pointer (about 0.35s) and picking up again (about 0.55s). */
const SLOW_TAU = 0.11;
const RESUME_TAU = 0.18;

/** "https://crazay.com/games" → "crazay.com". */
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Moves the track itself, frame by frame, rather than through a CSS animation:
 * nothing else (a re-render, a style change, a playback-rate change) can ever
 * restart or re-sync it, so tiles never jump. The loop length is measured from
 * where the second copy actually begins, so the wrap is exact. A mouse over the
 * row (or keyboard focus inside it) eases the speed to zero and back; it idles
 * while off screen, and stays still for reduced motion, where the row scrolls by hand.
 */
function useRoll(rollRef: RefObject<HTMLDivElement | null>, trackRef: RefObject<HTMLUListElement | null>, count: number) {
  useEffect(() => {
    const roll = rollRef.current;
    const track = trackRef.current;
    if (!roll || !track || count === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let loop = 0;
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const twin = track.children[count] as HTMLElement | undefined;
      loop = first && twin ? twin.offsetLeft - first.offsetLeft : 0;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);

    let offset = 0;
    let speed = 1;
    let target = 1;
    let last = 0;
    let frame = 0;

    const tick = (now: number) => {
      // A long gap (a background tab, a dropped frame) counts as one frame, never a leap.
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 0;
      last = now;
      speed += (target - speed) * (1 - Math.exp(-dt / (target < speed ? SLOW_TAU : RESUME_TAU)));
      if (Math.abs(target - speed) < 0.002) speed = target;
      if (loop > 0) {
        offset = (offset + (loop / (count * ROLL_SECONDS_PER_GAME)) * speed * dt) % loop;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const halt = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Only runs while the row is on screen.
    const view = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : halt()));
    view.observe(roll);

    /*
     * Stopped only while a mouse is actually over the row, or keyboard focus is
     * on one of its games. A game clicked open in a new tab keeps focus when you
     * come back, but that is mouse focus, not :focus-visible, so it no longer
     * holds the row still. Leaving the tab or window also forgets the hover,
     * since the browser never reports the pointer leaving in that case.
     */
    let hovering = false;
    const update = () => {
      target = hovering || roll.querySelector(":focus-visible") ? 0 : 1;
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovering = event.type !== "pointerleave";
      update();
    };
    // Focus has moved by the time the next frame runs, so read it then.
    const onFocus = () => requestAnimationFrame(update);
    const onAway = () => {
      hovering = false;
      update();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onAway();
    };
    roll.addEventListener("pointerenter", onPointer);
    roll.addEventListener("pointermove", onPointer);
    roll.addEventListener("pointerleave", onPointer);
    roll.addEventListener("focusin", onFocus);
    roll.addEventListener("focusout", onFocus);
    window.addEventListener("blur", onAway);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      halt();
      view.disconnect();
      resize.disconnect();
      roll.removeEventListener("pointerenter", onPointer);
      roll.removeEventListener("pointermove", onPointer);
      roll.removeEventListener("pointerleave", onPointer);
      roll.removeEventListener("focusin", onFocus);
      roll.removeEventListener("focusout", onFocus);
      window.removeEventListener("blur", onAway);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rollRef, trackRef, count]);
}

function GameCard({ game, copy }: { game: StudioGame; copy?: boolean }) {
  return (
    <li className={styles.gameItem} aria-hidden={copy || undefined}>
      <a href={game.url} target="_blank" rel="noopener noreferrer" className={styles.game} tabIndex={copy ? -1 : undefined}>
        <span className={styles.gameArt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.image} alt="" loading="lazy" width={768} height={432} />
        </span>
        <span className={styles.gameName}>{game.name}</span>
        <span className={styles.gamePlaying}>{formatExact(game.playing)} playing</span>
        <span className="visually-hidden"> on Roblox (opens in a new tab)</span>
      </a>
    </li>
  );
}

/** The studio I work with: its live figures, a way to its own site, and its busiest games rolling past. */
export function Studio() {
  const { data } = useProfile();
  const totals = data.studio;
  const top = totals?.top ?? [];
  const rollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  useRoll(rollRef, trackRef, top.length);
  if (!studio) return null;

  const host = hostOf(studio.url);
  const figures = totals
    ? [
        { id: "playing", value: formatExact(totals.playing), label: site.liveMetrics ? "playing now" : "playing" },
        { id: "visits", value: formatCompact(totals.visits), label: "visits" },
        { id: "games", value: formatExact(totals.games), label: "games" },
      ]
    : [];

  return (
    <section id="studio" className={styles.section} aria-labelledby="studio-title">
      <div className="container">
        <SectionHead id="studio-title" title="Studio" />

        <div className={styles.card} {...reveal()}>
          <div className={styles.top}>
            <div className={styles.brand}>
              {studio.logo && (
                <span className={styles.logo} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={studio.logo} alt="" width={96} height={66} />
                </span>
              )}
              <div className={styles.identity}>
                <h3 className={styles.name}>{studio.name}</h3>
                {/* The studio-wide figures as one quiet line: "135,418 playing now · 6.5B visits · 29 games". */}
                {figures.length > 0 && (
                  <p className={styles.figures}>
                    <span className={styles.figureRow}>
                      {figures.map((figure) => (
                        <span key={figure.id} className={styles.figure}>
                          <strong>{figure.value}</strong> {figure.label}
                        </span>
                      ))}
                    </span>
                  </p>
                )}
                {studio.about && <p className={styles.about}>{studio.about}</p>}
              </div>
            </div>
            <a href={studio.url} target="_blank" rel="noopener noreferrer" className={`button button-secondary ${styles.visit}`}>
              Visit {host}
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.visitIcon}>
                <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>

          {top.length > 0 && (
            <div className={styles.rollWrap}>
              <div ref={rollRef} className={styles.roll}>
                {/* Two copies back to back make the loop seamless; the second is for the eye only. */}
                <ul ref={trackRef} className={styles.track} aria-label={`Top games from ${studio.name}`}>
                  {top.map((game) => (
                    <GameCard key={game.url} game={game} />
                  ))}
                  {top.map((game) => (
                    <GameCard key={`${game.url}-copy`} game={game} copy />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
