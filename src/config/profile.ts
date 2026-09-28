/**
 * Personal information. Every name, handle and link on the site reads from
 * here. Your display name, verification and avatar are also read live from
 * Roblox using `robloxUserId`; these values are the fallback.
 *
 * Values in [brackets] are never rendered in production.
 */
export const profile = {
  username: "Tapecti",
  displayName: "Tapecti",
  robloxUserId: "5299412295",
  robloxUsername: "Tapecti",
  robloxProfile: "https://www.roblox.com/users/5299412295/profile",
  discordUsername: "Tapecti",
  /** Discord user ID 1324004191009767477 */
  discordUrl: "https://discord.com/users/1324004191009767477",
} as const;

export type Profile = typeof profile;
