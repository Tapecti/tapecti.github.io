"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { creations } from "@/data/creations";
import { experiences } from "@/data/projects";
import type { StatsPayload } from "@/lib/metrics";
import { basePath, experiencePath, homePath, idFromPathname } from "@/lib/paths";
import { isConfigured } from "@/lib/placeholder";
import type { ProfileData } from "@/lib/profile-data";
import { ProfileContext, type ProfileContextValue } from "./context";
import { ExperienceView } from "./ExperienceView";
import { useImageFade } from "./fadeImages";
import { Nav } from "./Nav";
import { Collaborators } from "./sections/Collaborators";
import { Contact } from "./sections/Contact";
import { Creations } from "./sections/Creations";
import { Experiences } from "./sections/Experiences";
import { Footer } from "./sections/Footer";
import { Groups } from "./sections/Groups";
import { Hero } from "./sections/Hero";
import { Studio } from "./sections/Studio";

/** Smaller tiles under the featured game; everything after them waits behind "Show all games". */
const SHOWCASE_TILES = 6;
/*
 * A game only earns a tile once it has found real players and they liked it.
 * The rest are still listed under "Show all games": early games shown next to
 * the hits read as failures, however many there are.
 */
const TILE_MIN_VISITS = 300_000;
const TILE_MIN_LIKED = 0.6;
/** Past this many visits a game has proved itself, whatever its rating says. */
const TILE_PROVEN_VISITS = 1_000_000;

type Props = {
  data: ProfileData;
  /** Experience to open on load, from a /experiences/:id URL. */
  initialExperienceId?: string;
};

const pathFor = (id: string | null) => (id ? experiencePath(id) : homePath);

/**
 * Stops the page scrolling behind an open game, from the click until the window
 * has finished closing, so no scroll ever lands on the profile while the window
 * is on screen. Padding stands in for the scrollbar so nothing shifts sideways.
 */
function lockScroll(locked: boolean) {
  const root = document.documentElement;
  if (locked === (root.style.overflow === "hidden")) return;
  const scrollbar = window.innerWidth - root.clientWidth;
  root.style.paddingRight = locked && scrollbar > 0 ? `${scrollbar}px` : "";
  root.style.overflow = locked ? "hidden" : "";
}

function idFromPath(pathname: string): string | null {
  const id = idFromPathname(pathname);
  return id && experiences.some((e) => e.id === id) ? id : null;
}

export function ProfileApp({ data, initialExperienceId }: Props) {
  const [stats, setStats] = useState(data.stats.experiences);
  const [openId, setOpenId] = useState<string | null>(initialExperienceId ?? null);
  /** Kept mounted while its closing animation plays. */
  const [closingId, setClosingId] = useState<string | null>(null);
  const openedFrom = useRef<HTMLElement | null>(null);
  useImageFade();

  /* ── Live stats: refreshed while the tab is visible ─────── */

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        // Trailing slash and base path both matter: without them this redirects, or 404s under /<repo>.
        const response = await fetch(`${basePath}/api/metrics/`);
        if (!response.ok) return;
        const payload = (await response.json()) as StatsPayload;
        if (!cancelled) {
          // Keep the last good figures for any experience Roblox didn't return this time.
          setStats((prev) => {
            const next = { ...prev };
            for (const [id, value] of Object.entries(payload.experiences)) if (value) next[id] = value;
            return next;
          });
        }
      } catch {
        // Offline or blocked: the server-rendered figures stay on screen.
      }
    };
    if (!site.liveMetrics) return;
    const interval = window.setInterval(load, site.metricsRefreshSeconds * 1000);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  /* ── Experience detail: URL, history, focus, scroll lock ─ */

  const openIdRef = useRef(openId);
  openIdRef.current = openId;

  const open = useCallback((id: string) => {
    // Moving between games inside the window swaps its content in place.
    if (openIdRef.current) {
      setOpenId(id);
      window.history.replaceState(window.history.state, "", pathFor(id));
      return;
    }
    openedFrom.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Locked at once: from the first frame the scroll belongs to the window, not the profile.
    lockScroll(true);
    setClosingId(null);
    setOpenId(id);
    if (window.location.pathname !== pathFor(id)) window.history.pushState({ experience: id }, "", pathFor(id));
  }, []);

  const close = useCallback(() => {
    const current = openIdRef.current;
    if (!current) return;
    setClosingId(current);
    setOpenId(null);
    if (window.history.state?.experience) window.history.back();
    else window.history.replaceState(null, "", homePath);
  }, []);

  /** The window has finished closing: unmount it, free the page and hand focus back. */
  const onClosed = useCallback(() => {
    setClosingId(null);
    if (!openIdRef.current) lockScroll(false);
    openedFrom.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onPop = () => {
      const id = idFromPath(window.location.pathname);
      // Going back closes the window with the same animation as its button.
      if (!id && openIdRef.current) setClosingId(openIdRef.current);
      if (id) lockScroll(true);
      setOpenId(id);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (openId) lockScroll(true);
    const entry = experiences.find((e) => e.id === openId);
    document.title = entry ? `${entry.title}, ${profile.displayName}` : site.title;
  }, [openId]);

  /* ── Derived data ───────────────────────────────────────── */

  const value = useMemo<ProfileContextValue>(() => {
    const identity = {
      displayName: data.user?.displayName ?? profile.displayName,
      username: data.user?.name ?? profile.robloxUsername,
      verified: data.user?.verified ?? false,
      avatar: data.user?.avatar,
      headshot: data.user?.headshot,
    };

    const visits = (id: string) => stats[id]?.visits ?? -1;
    const byVisits = (list: typeof experiences) => [...list].sort((a, b) => visits(b.id) - visits(a.id));
    const featured = experiences.filter((e) => e.featured);
    // Curated games take the tile slots first; the best archived games fill any left.
    const candidates = [
      ...byVisits(experiences.filter((e) => !e.featured && !e.archive)),
      ...byVisits(experiences.filter((e) => !e.featured && e.archive)),
    ];
    const proven = (id: string) => {
      const live = stats[id];
      if (!live || live.visits < TILE_MIN_VISITS) return false;
      if (live.visits >= TILE_PROVEN_VISITS) return true;
      const votes = (live.likes ?? 0) + (live.dislikes ?? 0);
      return votes === 0 || (live.likes ?? 0) / votes >= TILE_MIN_LIKED;
    };
    const tiles = byVisits(candidates.filter((e) => proven(e.id)).slice(0, SHOWCASE_TILES));

    return {
      data,
      identity,
      stats,
      ordered: [...featured, ...tiles, ...candidates.filter((e) => !tiles.includes(e))],
      showcaseSize: featured.length + tiles.length,
      group: (id) => (id ? data.groups[id] : undefined),
      images: (experience) => [
        ...(experience.images ?? []).filter((img) => isConfigured(img.src)).map((img) => img.src),
        ...(stats[experience.id]?.images ?? []),
      ],
      openId,
      open,
      close,
    };
  }, [data, stats, openId, open, close]);

  const shownId = openId ?? closingId;
  const current = experiences.find((e) => e.id === shownId);
  const hasCreations = creations.length > 0;

  return (
    <ProfileContext.Provider value={value}>
      <a className="skip-link" href="#experiences">
        Skip to experiences
      </a>
      <div inert={Boolean(openId)}>
        <Nav hasCreations={hasCreations} />
        <main id="top">
          <Hero />
          <Collaborators />
          <Experiences />
          <Studio />
          <Groups />
          {hasCreations && <Creations />}
          <Contact />
        </main>
        <Footer />
      </div>
      {current && <ExperienceView experience={current} closing={openId === null} onClosed={onClosed} />}
    </ProfileContext.Provider>
  );
}
