"use client";

import { createContext, useContext } from "react";
import type { Experience } from "@/data/types";
import type { ProfileData } from "@/lib/profile-data";
import type { RobloxGroup, UniverseStats } from "@/lib/roblox";

export type Identity = {
  displayName: string;
  username: string;
  verified: boolean;
  avatar?: string;
  headshot?: string;
};

export type ProfileContextValue = {
  data: ProfileData;
  identity: Identity;
  /** Live stats, refreshed in the browser. */
  stats: Record<string, UniverseStats | undefined>;
  /** Experiences in display order: featured, the showcase tiles, then the rest by visits. */
  ordered: Experience[];
  /** How many of `ordered` are on show; the rest wait behind "Show all games". */
  showcaseSize: number;
  group: (id: number | undefined) => RobloxGroup | undefined;
  /** Images for an experience: local screenshots first, then Roblox thumbnails. */
  images: (experience: Experience) => string[];
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
};

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside <ProfileApp>.");
  return value;
}
