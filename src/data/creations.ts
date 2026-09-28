import type { Creation } from "./types";

/**
 * Serious engineering work that isn't a whole game: combat systems,
 * matchmaking, procedural generation, networking infrastructure, tooling.
 * The Creations section appears once this list has an entry.
 *
 * {
 *   id: "matchmaking",
 *   title: "Cross-server matchmaking",
 *   summary: "One line on what it does.",
 *   details: ["What made it hard.", "How it scales."],
 *   usedIn: ["my-asmr-house"],
 *   code: { filename: "Matchmaker.luau", language: "luau", source: "..." },
 * },
 */
export const creations: Creation[] = [];
