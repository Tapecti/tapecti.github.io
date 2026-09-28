"use client";

import { useEffect } from "react";

const SELECTOR = "img[data-fade]";

function markLoaded(img: HTMLImageElement) {
  img.setAttribute("data-loaded", "");
}

/**
 * Images marked `data-fade` stay transparent until they have loaded, then
 * fade in, instead of popping in line by line. Images that were already
 * loaded (from cache, or before this ran) are shown at once.
 */
export function useImageFade() {
  useEffect(() => {
    const settle = (img: HTMLImageElement) => {
      if (img.complete) markLoaded(img);
    };
    document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach(settle);

    // A failed image is shown too, so nothing is ever left invisible.
    const onDone = (event: Event) => {
      if (event.target instanceof HTMLImageElement && event.target.matches(SELECTOR)) markLoaded(event.target);
    };
    document.addEventListener("load", onDone, true);
    document.addEventListener("error", onDone, true);

    // Images added later, such as a game window's art, may already be cached.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) settle(node as HTMLImageElement);
          node.querySelectorAll<HTMLImageElement>(SELECTOR).forEach(settle);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("load", onDone, true);
      document.removeEventListener("error", onDone, true);
      observer.disconnect();
    };
  }, []);
}
