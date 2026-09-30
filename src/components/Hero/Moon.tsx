"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

/** The moon's orbit, in the hero graphic's 800×800 viewBox. Matches the outer orbit ellipse. */
const ORBIT = { cx: 400, cy: 400, rx: 290, ry: 105, tilt: (-24 * Math.PI) / 180 };
/** Seconds per orbit. */
const PERIOD = 32;

/** Where the moon is `seconds` in: its point, and how near it is (-1 far side, 1 nearest), for its size and brightness. */
function moonAt(seconds: number) {
  const angle = ((seconds % PERIOD) / PERIOD) * Math.PI * 2;
  const ox = ORBIT.rx * Math.cos(angle);
  const oy = ORBIT.ry * Math.sin(angle);
  return {
    x: ORBIT.cx + ox * Math.cos(ORBIT.tilt) - oy * Math.sin(ORBIT.tilt),
    y: ORBIT.cy + ox * Math.sin(ORBIT.tilt) + oy * Math.cos(ORBIT.tilt),
    // The lower half of the tilted ellipse is the half nearer to us.
    near: Math.sin(angle),
  };
}

/**
 * The moon on its orbit, like a real one: in front of Earth on the near
 * (lower) half of the orbit, behind it on the far (upper) half. Rendered once
 * behind the planet ("back") and once in front ("front"); each copy shows
 * only on its half.
 *
 * "backing" draws just a solid disc on the same orbit, always shown: it sits
 * under the see-through hero graphic so background stars don't show through
 * the moon (see Hero.tsx).
 */
export function Moon({ layer }: { layer: "back" | "front" | "backing" }) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const draw = (seconds: number) => {
      const { x, y, near } = moonAt(seconds);
      const shown = layer === "backing" || (layer === "front" ? near >= 0 : near < 0);
      el.style.display = shown ? "" : "none";
      if (!shown) return;
      // A touch bigger up close, smaller and dimmer on the far side.
      const scale = 1 + 0.16 * near;
      el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)})`);
      if (layer !== "backing") el.style.opacity = String(0.8 + 0.2 * Math.max(0, near) + 0.12 * Math.min(0, near));
    };

    const loop = (time: number) => {
      draw(time / 1000);
      frame = requestAnimationFrame(loop);
    };
    let onScreen = true;
    const start = () => {
      cancelAnimationFrame(frame);
      if (motion.matches) draw(PERIOD * 0.3); // still: out front, lower right
      else if (onScreen && !document.hidden) frame = requestAnimationFrame(loop);
      else draw(performance.now() / 1000); // off-screen or in a background tab: place it, then rest
    };

    const svg = el.ownerSVGElement;
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      start();
    });
    if (svg) visibility.observe(svg);

    start();
    document.addEventListener("visibilitychange", start);
    motion.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      document.removeEventListener("visibilitychange", start);
      motion.removeEventListener("change", start);
    };
  }, [layer]);

  if (layer === "backing") {
    return (
      <g ref={ref}>
        <circle r="10.5" />
      </g>
    );
  }

  return (
    <g ref={ref} className={styles.moon}>
      <circle r="10" fill="url(#moon-surface)" />
      {/* maria (the dark "seas") and a few craters */}
      <ellipse cx="-3" cy="-2.6" rx="3.3" ry="2.5" className={styles.mare} />
      <ellipse cx="2.6" cy="1.2" rx="2.5" ry="1.9" className={styles.mare} />
      <ellipse cx="-0.6" cy="-6" rx="1.6" ry="1" className={styles.mare} />
      <circle cx="-1.2" cy="4.8" r="1.15" className={styles.crater} />
      <circle cx="4.6" cy="-3.8" r="0.85" className={styles.crater} />
      <circle cx="-6" cy="1.8" r="0.7" className={styles.crater} />
      <circle cx="1.8" cy="6.6" r="0.6" className={styles.crater} />
      {/* shadowed limb, away from the light */}
      <circle r="10" fill="url(#moon-shadow)" />
    </g>
  );
}
