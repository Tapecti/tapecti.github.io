"use client";

import styles from "./ThemeToggle.module.css";

function isDark(): boolean {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Switches between light and dark and remembers the choice. Both icons are
 * rendered and CSS shows the right one, so server and client markup match.
 */
export function ThemeToggle() {
  const toggle = () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
  };

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label="Toggle dark mode">
      <svg className={styles.moon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.2 14.6A8.5 8.5 0 0 1 9.4 3.8a8.5 8.5 0 1 0 10.8 10.8Z" />
      </svg>
      <svg className={styles.sun} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.55 1.55M17.15 17.15l1.55 1.55M5.3 18.7l1.55-1.55M17.15 6.85l1.55-1.55" />
      </svg>
    </button>
  );
}
