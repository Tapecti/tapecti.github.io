import type { CSSProperties } from "react";

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-shown", "");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px" },
  );
  return observer;
}

/** Ref callback: the element rises into place the first time it scrolls into view. */
function observe(element: HTMLElement | null) {
  if (!element) return;
  if (typeof IntersectionObserver === "undefined") {
    element.setAttribute("data-shown", "");
    return;
  }
  const io = getObserver();
  io.observe(element);
  return () => io.unobserve(element);
}

/**
 * Props for an element that should rise in on scroll. `index` staggers
 * neighbours, e.g. the column a tile sits in.
 */
export function reveal(index = 0): { ref: typeof observe; "data-reveal": ""; style?: CSSProperties } {
  return {
    ref: observe,
    "data-reveal": "",
    ...(index > 0 ? { style: { "--reveal-i": index } as CSSProperties } : {}),
  };
}

/** Props for an element that plays its entrance on first paint. */
export function enter(index = 0): { "data-enter": ""; style?: CSSProperties } {
  return {
    "data-enter": "",
    ...(index > 0 ? { style: { "--enter-i": index } as CSSProperties } : {}),
  };
}
