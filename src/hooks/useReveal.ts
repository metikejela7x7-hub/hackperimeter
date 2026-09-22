"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first enters the viewport, then disconnects.
 * Pair with the global `.reveal` / `.reveal-group` utility classes, which
 * read `data-visible` and are neutralised by `prefers-reduced-motion`.
 */
export function useReveal<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px", ...options },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible } as const;
}
