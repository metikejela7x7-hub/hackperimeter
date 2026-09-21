"use client";

import { useEffect, useRef } from "react";
import styles from "./StarField.module.css";

interface Star {
  x: number; // 0–1
  y: number; // 0–1
  r: number;
  alpha: number;
  depth: number; // 0–1, drives scroll parallax
  speed: number;
  phase: number;
  amber: boolean;
}

const OFF_WHITE = "241, 237, 228";
const AMBER = "217, 154, 43";

function createStars(width: number, height: number): Star[] {
  const count = Math.min(220, Math.round((width * height) / 7000));
  return Array.from({ length: count }, () => {
    const depth = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + depth * 0.9,
      alpha: 0.25 + Math.random() * 0.55,
      depth,
      speed: 0.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      amber: Math.random() < 0.06,
    };
  });
}

/** Fixed, decorative star layer. Static under prefers-reduced-motion. */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthChanged = window.innerWidth !== width;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile URL-bar resizes only change height; keep the same stars then.
      if (widthChanged || stars.length === 0) stars = createStars(width, height);
      draw(performance.now());
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const scroll = window.scrollY;
      const t = motion.matches ? 0 : time / 1000;

      for (const star of stars) {
        const shift = scroll * star.depth * 0.12;
        const y = (((star.y * height - shift) % height) + height) % height;
        const twinkle = motion.matches
          ? 1
          : 0.65 + 0.35 * Math.sin(t * star.speed + star.phase);
        ctx.fillStyle = `rgba(${star.amber ? AMBER : OFF_WHITE}, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * width, y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      if (motion.matches) draw(0);
    };

    resize();
    start();

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", start);
    motion.addEventListener("change", start);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", start);
      motion.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
