"use client";

import { useEffect, useRef } from "react";
import styles from "./Quarantine.module.css";

/** Small deterministic PRNG, so eye and hand placement match on server and client. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

interface Eyes {
  /** Position in the strip, in percent. */
  x: number;
  y: number;
  /** Nearer eyes are bigger and brighter. */
  size: number;
  /** Seconds before this pair opens once the strip is on screen. */
  wake: number;
  /** Seconds between blinks, and when the first one falls. */
  blinkEvery: number;
  blinkOffset: number;
}

interface Hand {
  x: number;
  scale: number;
  tilt: number;
  flip: boolean;
  /** How far it rises as the page bottom comes into view (0–1). */
  reach: number;
  sway: number;
}

const rand = seeded(1106);

const EYES: Eyes[] = Array.from({ length: 15 }, (_, i) => {
  const near = rand();
  return {
    x: 4 + ((i + rand() * 0.8) / 15) * 92,
    y: 18 + rand() * 48,
    size: 0.6 + near * 0.8,
    wake: 0.3 + rand() * 3.2,
    blinkEvery: 5 + rand() * 7,
    blinkOffset: rand() * 6,
  };
});

const HANDS: Hand[] = Array.from({ length: 11 }, (_, i) => ({
  x: 3 + ((i + rand() * 0.6) / 11) * 94,
  scale: 0.95 + rand() * 0.55,
  tilt: -14 + rand() * 28,
  flip: rand() < 0.5,
  reach: 0.82 + rand() * 0.18,
  sway: 3 + rand() * 3,
}));

const TAPE = "Quarantine zone ▲ Do not cross ▲ ";

/** Forearm and clawing hand, fingers up. 30×70 box. */
function HandShape() {
  return (
    <svg className={styles.hand} viewBox="0 0 30 70" focusable="false">
      <path d="M8 70 L9.5 42 C8 38 6.5 33 5.5 28 L3 16 C2.6 14 5 13.4 5.6 15.4 L8 24 L7.2 10 C7 7.8 9.8 7.6 10 9.8 L11.4 22 L12 6.5 C12 4.2 15 4.2 15 6.5 L15.2 22 L17.4 9 C17.8 6.8 20.6 7.4 20.2 9.6 L18.6 24 L22.4 17 C23.4 15.2 25.8 16.4 24.9 18.3 L20.5 30 C19.6 33 19 37 19.2 42 L20.5 70 Z" />
    </svg>
  );
}

/**
 * The strip above the footer: quarantine tape, eyes opening in the dark and
 * following the cursor, and hands reaching up as the page ends.
 */
export function Quarantine() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const eyeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    // Wake the eyes the first time the strip scrolls into view.
    const onScreen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) scene.dataset.awake = "true";
        scene.dataset.visible = String(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );
    onScreen.observe(scene);

    // Hands rise as the bottom of the strip comes up the screen.
    const update = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const view = window.innerHeight;
      const rise = Math.min(1, Math.max(0, (view - rect.top) / (rect.height * 0.85)));
      scene.style.setProperty("--rise", rise.toFixed(3));

      // Eyes turn toward the pointer (a couple of px is enough to read as a glance).
      if (pointer && scene.dataset.visible === "true" && !motion.matches) {
        eyeRefs.current.forEach((el) => {
          if (!el) return;
          const box = el.getBoundingClientRect();
          const dx = pointer!.x - (box.left + box.width / 2);
          const dy = pointer!.y - (box.top + box.height / 2);
          const len = Math.hypot(dx, dy) || 1;
          el.style.setProperty("--look-x", `${((dx / len) * 2.2).toFixed(2)}px`);
          el.style.setProperty("--look-y", `${((dy / len) * 1.4).toFixed(2)}px`);
        });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onPointer = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      // Remember where it is, but only do the work while the strip is on screen.
      if (scene.dataset.visible === "true") schedule();
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      onScreen.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.zone} aria-hidden="true">
      <div className={styles.tape}>
        <div className={styles.tapeTrack}>
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.tapeText}>
              {TAPE.repeat(6)}
            </span>
          ))}
        </div>
      </div>

      {EYES.map((eyes, i) => (
        <span
          key={i}
          ref={(el) => {
            eyeRefs.current[i] = el;
          }}
          className={styles.eyes}
          style={
            {
              left: `${eyes.x}%`,
              top: `${eyes.y}%`,
              "--size": eyes.size,
              "--wake": `${eyes.wake}s`,
              "--blink": `${eyes.blinkEvery}s`,
              "--blink-offset": `${-eyes.blinkOffset}s`,
            } as React.CSSProperties
          }
        >
          <span className={styles.eye} />
          <span className={styles.eye} />
        </span>
      ))}

      <div className={styles.fog} />
      {HANDS.map((hand, i) => (
        <span
          key={i}
          className={styles.handSpot}
          style={
            {
              left: `${hand.x}%`,
              "--scale": hand.scale,
              "--tilt": `${hand.tilt}deg`,
              "--flip": hand.flip ? -1 : 1,
              "--reach": hand.reach,
              "--sway": `${hand.sway}s`,
            } as React.CSSProperties
          }
        >
          <HandShape />
        </span>
      ))}
    </div>
  );
}
