"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CopyButton.module.css";

type Props = {
  value: string;
  /** What is being copied, for the accessible name, e.g. "Discord username". */
  description: string;
  /** Visible wording before copying. */
  label?: string;
  className?: string;
};

export function CopyButton({ value, description, label = "Copy", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" onClick={copy} className={`${styles.button} ${className}`} data-copied={copied || undefined} aria-label={`Copy ${description}`}>
      <span className={styles.labels} aria-hidden="true">
        <span>{label}</span>
        <span>Copied</span>
      </span>
      <span className="visually-hidden" role="status">
        {copied ? `${description} copied to clipboard` : ""}
      </span>
    </button>
  );
}
