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

interface GalaxyDust {
  radius: number; // 0–1 of the galaxy's size
  angle: number;
  r: number;
  alpha: number;
  amber: boolean;
}

interface Meteor {
  x: number;
  y: number;
  angle: number;
  born: number; // ms
}

const OFF_WHITE = "241, 237, 228";
const AMBER = "217, 154, 43";

const GALAXY_ARMS = 2;
/** Radians per second: one turn about every two minutes, slow but visible. */
const GALAXY_SPIN = 0.05;
const METEOR_LIFE = 900; // ms

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

/** Dust along two logarithmic spiral arms, densest near the core. */
function createGalaxy(): GalaxyDust[] {
  return Array.from({ length: 700 }, (_, i) => {
    const radius = Math.pow(Math.random(), 0.7);
    const arm = (i % GALAXY_ARMS) * ((Math.PI * 2) / GALAXY_ARMS);
    const scatter = (Math.random() - 0.5) * (0.5 + radius * 0.6);
    return {
      radius,
      angle: arm + radius * Math.PI * 3.2 + scatter,
      r: 0.5 + Math.random() * 0.8,
      alpha: (0.18 + Math.random() * 0.4) * (1 - radius * 0.55),
      amber: Math.random() < 0.18,
    };
  });
}

/** Fixed, decorative star layer with a distant galaxy and the odd meteor. Static under prefers-reduced-motion. */
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
    const galaxy = createGalaxy();
    let meteor: Meteor | null = null;
    let nextMeteor = performance.now() + 4000;
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

      drawGalaxy(t, scroll);
      if (!motion.matches) drawMeteor(time);
    };

    /** A tilted spiral low on the left, drifting slower than the stars on scroll. */
    const drawGalaxy = (t: number, scroll: number) => {
      const size = Math.min(Math.max(width, height) * 0.26, 360);
      const cx = width * (width < 640 ? 0.2 : 0.12);
      const cy = height * 0.78 - scroll * 0.02;
      const tilt = -0.45;
      const squash = 0.5;
      const spin = t * GALAXY_SPIN;

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.35);
      core.addColorStop(0, `rgba(${AMBER}, 0.16)`);
      core.addColorStop(1, `rgba(${AMBER}, 0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.35, size * 0.35 * squash, tilt, 0, Math.PI * 2);
      ctx.fill();

      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      for (const dust of galaxy) {
        const a = dust.angle + spin;
        const px = Math.cos(a) * dust.radius * size;
        const py = Math.sin(a) * dust.radius * size * squash;
        ctx.fillStyle = `rgba(${dust.amber ? AMBER : OFF_WHITE}, ${dust.alpha})`;
        ctx.fillRect(cx + px * cosT - py * sinT, cy + px * sinT + py * cosT, dust.r, dust.r);
      }
    };

    /** One short streak every 7–16 s, somewhere in the upper sky. */
    const drawMeteor = (time: number) => {
      if (!meteor && time >= nextMeteor) {
        meteor = {
          x: width * (0.35 + Math.random() * 0.6),
          y: height * Math.random() * 0.35,
          angle: Math.PI * (0.72 + Math.random() * 0.1),
          born: time,
        };
      }
      if (!meteor) return;

      const age = (time - meteor.born) / METEOR_LIFE;
      if (age >= 1) {
        meteor = null;
        nextMeteor = time + 7000 + Math.random() * 9000;
        return;
      }
      const travel = age * Math.min(width, 900) * 0.35;
      const length = 90 * Math.sin(age * Math.PI);
      const hx = meteor.x + Math.cos(meteor.angle) * travel;
      const hy = meteor.y + Math.sin(meteor.angle) * travel;
      const tx = hx - Math.cos(meteor.angle) * length;
      const ty = hy - Math.sin(meteor.angle) * length;
      const trail = ctx.createLinearGradient(hx, hy, tx, ty);
      trail.addColorStop(0, `rgba(${OFF_WHITE}, ${0.7 * (1 - age)})`);
      trail.addColorStop(1, `rgba(${OFF_WHITE}, 0)`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
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
