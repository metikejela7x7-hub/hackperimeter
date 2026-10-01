"use client";

import { useEffect, useRef } from "react";
import styles from "./Zombie.module.css";

/**
 * The outbreak's own mascot: fixed to the screen, the same way StarField is.
 * Invisible above "The scenario" (section 02, id="mission") — appears the
 * moment its top edge reaches the top of the viewport, and stays on screen
 * from there through the rest of the page. Scrolling back up above that
 * point hides it again.
 */
export function Zombie() {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    const mission = document.getElementById("mission");
    if (!el || !mission) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      el.dataset.visible = String(mission.getBoundingClientRect().top <= 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <img
      ref={ref}
      className={styles.zombie}
      src="/images/zombie.png"
      alt=""
      aria-hidden="true"
      data-visible="false"
    />
  );
}
