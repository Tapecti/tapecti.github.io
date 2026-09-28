"use client";

import { useEffect, useRef, useState } from "react";
import { formatExact } from "@/lib/format";

const DURATION_MS = 900;

/**
 * Live counts glide between values instead of snapping, which is the only
 * signal that the figure is live. The first value appears without counting
 * up, and assistive technology gets the settled value only.
 */
export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS);
      const current = start + (value - start) * (1 - Math.pow(1 - t, 3));
      from.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      <span aria-hidden="true">{formatExact(display)}</span>
      <span className="visually-hidden">{formatExact(value)}</span>
    </>
  );
}
