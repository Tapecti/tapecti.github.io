/**
 * People Tapecti has built with, past and present. Names, display names,
 * verification, avatars and follower counts are read live from Roblox; the
 * Discord ID lets visitors reach them directly.
 *
 * Written in Tapecti's own voice: a personal portfolio, not a team page.
 * Refer to people by their Roblox display name, which is what visitors see.
 */
export type Collaborator = {
  robloxUserId: number;
  /** Discord user IDs exceed JavaScript's safe integers, so they stay strings. */
  discordUserId?: string;
  /** Working together now. Marked with a star and listed first. */
  current?: boolean;
  /** A golden glow for the person who made the rest possible. */
  highlight?: boolean;
  /** A word or two under their name, like the subtitle on a Roblox friend. */
  role: string;
  /** A sentence or two for their card, always generous. */
  about: string;
};

export const collaborators: Collaborator[] = [
  {
    robloxUserId: 382906892, // King
    discordUserId: "313792508943400961",
    current: true,
    highlight: true,
    role: "Partner and mentor",
    about:
      "My closest and longest-standing collaborator. He has guided, funded and mentored me, and is involved in every part of the projects we build together, from brainstorming to testing.",
  },
  {
    robloxUserId: 23899869, // joey
    discordUserId: "220292783804514316",
    current: true,
    role: "Builder",
    about: "A skilled builder I work with closely. He built the maps for Driving Test, Clean The Rooms and most of Sail a Boat.",
  },
  {
    robloxUserId: 1470652660, // Gabriel (Gab)
    discordUserId: "888077704568639529",
    role: "Producer",
    about: "Worked with me on Stack Battles, Be a Brainrot, Don't Get Stomped! and Get Off The Road!",
  },
  {
    robloxUserId: 91632145, // SmokeBomb
    discordUserId: "331525909213609995",
    role: "3D modeler",
    about: "Made the models for My ASMR House.",
  },
  {
    robloxUserId: 4728895801, // Ryan
    discordUserId: "1120571293163597854",
    role: "Designer",
    about:
      "A partner on several of my projects. He designs complete user interfaces, helps shape the ideas behind the games and tests them before release.",
  },
  {
    robloxUserId: 486226211, // Slender
    discordUserId: "832965404774367242",
    role: "Scripter",
    about: "A fellow scripter who helped me restructure my framework, which I still build on today.",
  },
  {
    robloxUserId: 46415248, // dead3ye
    discordUserId: "402892004272373791",
    role: "Thumbnail artist",
    about: "Designed the icons and thumbnails for Shockwave, The Button: 2048, 2048 - Tycoon and Quick Play.",
  },
];
