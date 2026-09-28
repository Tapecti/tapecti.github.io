import type { ReactNode } from "react";
import styles from "./Tip.module.css";

export type TipSide = "top" | "bottom";
export type TipAlign = "center" | "start" | "end";

type BubbleProps = { label?: ReactNode; side?: TipSide; align?: TipAlign };

/**
 * The bubble on its own, for elements that already have a layout class and
 * add `tipClass` themselves. It repeats what the element's accessible name
 * already says, so assistive technology skips it.
 */
export function TipBubble({ label, side = "top", align = "center" }: BubbleProps) {
  if (!label) return null;
  return (
    <span className={styles.bubble} data-side={side} data-align={align} aria-hidden="true">
      {label}
    </span>
  );
}

export const tipClass = styles.tip;

/** A short line of context shown on hover or keyboard focus. */
export function Tip({ label, side, align, className = "", children }: BubbleProps & { className?: string; children: ReactNode }) {
  if (!label) return <>{children}</>;
  return (
    <span className={`${styles.tip} ${className}`}>
      {children}
      <TipBubble label={label} side={side} align={align} />
    </span>
  );
}
