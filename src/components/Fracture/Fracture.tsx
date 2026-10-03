"use client";

import { useEffect, useRef } from "react";
import styles from "./Fracture.module.css";

/** How opaque it gets at its peak, roughly between sections 01 and 02. */
const PEAK_OPACITY = 0.32;
/** How far it sinks downward over its whole appearance, at its most visible. */
const MAX_DRIFT_PX = 120;

/**
 * The world coming apart, centered behind the page, tied directly to scroll
 * position rather than popping in: invisible above "Event facts" (section
 * 01, id="facts"), it fades smoothly in as that section arrives, peaks
 * around "The scenario" (02), and fades back out by the time "Run of show"
 * (03, id="schedule") reaches the top — gone again from there on. Scrolling
 * back up reverses it exactly the same way, continuously, with no snap.
 */
export function Fracture() {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    const start = document.getElementById("facts");
    const end = document.getElementById("schedule");
    if (!el || !start || !end) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let startY = 0;
    let endY = 0;
    let frame = 0;

    const measure = () => {
      startY = start.getBoundingClientRect().top + window.scrollY;
      endY = end.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      frame = 0;
      // 0 at the top of section 01, 1 at the top of section 03.
      const span = Math.max(1, endY - startY);
      const progress = Math.min(1, Math.max(0, (window.scrollY - startY) / span));
      // A smooth rise and fall across that whole range, zero at both ends.
      el.style.opacity = String(PEAK_OPACITY * Math.sin(progress * Math.PI));
      const drift = motion.matches ? 0 : Math.sin(progress * Math.PI) * MAX_DRIFT_PX;
      el.style.setProperty("--drift", `${drift}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <img ref={ref} className={styles.fracture} src="/images/fracture.png" alt="" aria-hidden="true" />;
}
