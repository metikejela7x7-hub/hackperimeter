"use client";

import { useEffect, useRef } from "react";
import styles from "./StarField.module.css";

interface Star {
  /** Fixed position in px from the top-left of the sky; never rescaled, so resizing doesn't move it. */
  x: number;
  y: number;
  /** 0 (barely visible) to 1 (brightest). Most stars are faint, a few are bright. */
  brightness: number;
  /** Colour temperature, as an "r, g, b" string. */
  tint: string;
  /** Index into TINTS, for the pre-drawn glow sprite. */
  tintIndex: number;
  depth: number; // 0–1, drives scroll parallax
  /** Three flicker rates (per second) and offsets: layered, they make an irregular, turbulent twinkle. */
  rates: [number, number, number];
  phases: [number, number, number];
}

interface Meteor {
  x: number;
  y: number;
  angle: number;
  born: number; // ms
}

const OFF_WHITE = "241, 237, 228";

/**
 * Real star colours by temperature, hottest to coolest (blue-white, white,
 * yellow-white, orange). Weighted towards white, as in a real sky.
 */
const TINTS = ["170, 191, 255", "202, 215, 255", "248, 247, 255", "255, 244, 234", "255, 225, 190", "255, 204, 150"];
const TINT_WEIGHTS = [0.06, 0.14, 0.34, 0.26, 0.13, 0.07];

/** Stars brighter than this get a soft halo; brighter than BRIGHT_RAYS, faint cross-shaped rays too. */
const BRIGHT_HALO = 0.72;
const BRIGHT_RAYS = 0.9;

function pickTint(): number {
  let roll = Math.random();
  for (let i = 0; i < TINT_WEIGHTS.length; i += 1) {
    roll -= TINT_WEIGHTS[i];
    if (roll <= 0) return i;
  }
  return 2;
}

/** A soft round glow in one tint, drawn once and stamped for each bright star. */
function glowSprite(tint: string): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const g = sprite.getContext("2d")!;
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${tint}, 0.55)`);
  gradient.addColorStop(0.18, `rgba(${tint}, 0.22)`);
  gradient.addColorStop(0.5, `rgba(${tint}, 0.05)`);
  gradient.addColorStop(1, `rgba(${tint}, 0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  return sprite;
}

const GALAXY_ARMS = 2;
/**
 * Radians per second: one turn about every two minutes, slow but visible.
 * Negative so the arms trail behind the turn, as in a real spiral galaxy.
 */
const GALAXY_SPIN = -0.05;
const METEOR_LIFE = 900; // ms
/** Square px of sky per star (mostly faint pinpricks). */
const STAR_DENSITY = 6000;

/** Stars scattered over one rectangle of sky (px). */
function createStars(x0: number, y0: number, x1: number, y1: number): Star[] {
  const count = Math.round(((x1 - x0) * (y1 - y0)) / STAR_DENSITY);
  const rate = (min: number, max: number) => min + Math.random() * (max - min);
  const phase = () => Math.random() * Math.PI * 2;
  return Array.from({ length: count }, () => {
    const tintIndex = pickTint();
    return {
      x: x0 + Math.random() * (x1 - x0),
      y: y0 + Math.random() * (y1 - y0),
      // Steep curve: lots of dim stars, very few bright ones.
      brightness: Math.pow(Math.random(), 2.4),
      tint: TINTS[tintIndex],
      tintIndex,
      depth: Math.random(),
      rates: [rate(0.3, 0.9), rate(1.6, 3.2), rate(5, 9)],
      phases: [phase(), phase(), phase()],
    };
  });
}

/** Size of the pre-painted galaxy image, in px (face-on, before tilt and scale). */
const GALAXY_PX = 512;

/**
 * Paints a face-on spiral galaxy once, like a long-exposure photo: a warm
 * golden core of old stars, blue-white arms of young ones, pink star-forming
 * knots, dark dust lanes on the arms' inner edges, and a fine sprinkle of
 * stars. Each frame then only rotates and tilts this finished picture.
 */
function paintGalaxy(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = GALAXY_PX;
  const g = canvas.getContext("2d")!;
  const c = GALAXY_PX / 2;
  const R = GALAXY_PX * 0.47;

  /** Where arm `arm` is at `r` (0–1 of the radius): a logarithmic-style spiral. */
  const armAngle = (arm: number, r: number) =>
    arm * ((Math.PI * 2) / GALAXY_ARMS) + Math.log(1 + r * 9) * 2.7;
  const at = (angle: number, r: number): [number, number] => [
    c + Math.cos(angle) * r * R,
    c + Math.sin(angle) * r * R,
  ];
  const blob = (x: number, y: number, radius: number, color: string, alpha: number) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(${color}, ${alpha})`);
    grad.addColorStop(1, `rgba(${color}, 0)`);
    g.fillStyle = grad;
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  // Light adds up, as it does in a long exposure.
  g.globalCompositeOperation = "lighter";

  // Faint disc of unresolved stars: warm in the middle, cooling outward.
  const disc = g.createRadialGradient(c, c, 0, c, c, R);
  disc.addColorStop(0, "rgba(255, 214, 160, 0.22)");
  disc.addColorStop(0.45, "rgba(205, 196, 225, 0.07)");
  disc.addColorStop(1, "rgba(150, 170, 230, 0)");
  g.fillStyle = disc;
  g.fillRect(0, 0, GALAXY_PX, GALAXY_PX);

  // Arms: soft blue-white glow of young stars, thinning with distance.
  for (let arm = 0; arm < GALAXY_ARMS; arm += 1) {
    for (let i = 0; i < 900; i += 1) {
      const r = 0.1 + Math.pow(Math.random(), 0.9) * 0.9;
      const spread = 0.16 + r * 0.14; // arms widen as they wind out
      const angle = armAngle(arm, r) + gauss() * spread;
      const [x, y] = at(angle, r + gauss() * 0.045);
      const color = Math.random() < 0.65 ? "170, 196, 255" : "232, 232, 250";
      blob(x, y, (7 + 13 * (1 - r)) * (0.6 + Math.random() * 0.8), color, 0.028 * (1.15 - r));
    }
    // Feathery spurs branching off the arms, so they aren't perfectly smooth.
    for (let i = 0; i < 14; i += 1) {
      const r0 = 0.3 + Math.random() * 0.55;
      for (let k = 0; k < 18; k += 1) {
        const r = r0 + k * 0.012;
        const [x, y] = at(armAngle(arm, r0) + 0.1 + k * 0.035 + gauss() * 0.03, r);
        blob(x, y, 5 + Math.random() * 4, "190, 208, 255", 0.018);
      }
    }
  }

  // Star-forming regions: small pink-magenta knots strung along the arms, with a few blue clusters.
  for (let arm = 0; arm < GALAXY_ARMS; arm += 1) {
    for (let i = 0; i < 22; i += 1) {
      const r = 0.25 + Math.random() * 0.68;
      const [x, y] = at(armAngle(arm, r) + gauss() * 0.12, r + gauss() * 0.02);
      const pink = Math.random() < 0.7;
      blob(x, y, 1.8 + Math.random() * 2.4, pink ? "255, 140, 190" : "160, 196, 255", pink ? 0.32 : 0.28);
    }
  }

  // Dust lanes: dark bands hugging the inner edge of each arm.
  g.globalCompositeOperation = "destination-out";
  for (let arm = 0; arm < GALAXY_ARMS; arm += 1) {
    for (let i = 0; i < 260; i += 1) {
      const r = 0.08 + Math.random() * 0.78;
      const [x, y] = at(armAngle(arm, r) - (0.26 + r * 0.1) + gauss() * 0.06, r);
      blob(x, y, 5 + 8 * (1 - r), "0, 0, 0", 0.1);
    }
  }
  g.globalCompositeOperation = "lighter";

  // Resolved stars: dense and warm near the core, sparser and bluer in the arms.
  for (let i = 0; i < 700; i += 1) {
    const inArm = Math.random() < 0.6;
    const r = inArm ? 0.1 + Math.random() * 0.9 : Math.pow(Math.random(), 2) * 0.55;
    const angle = inArm
      ? armAngle(Math.floor(Math.random() * GALAXY_ARMS), r) + gauss() * (0.08 + r * 0.1)
      : Math.random() * Math.PI * 2;
    const [x, y] = at(angle, r);
    const warm = r < 0.3 ? 0.75 : 0.25;
    const color = Math.random() < warm ? "255, 222, 180" : "215, 228, 255";
    g.fillStyle = `rgba(${color}, ${0.15 + Math.random() * 0.4})`;
    const size = Math.random() < 0.08 ? 1.6 : 0.9;
    g.fillRect(x, y, size, size);
  }

  // The bulge: a bright golden-white core that fades into the disc.
  blob(c, c, R * 0.38, "255, 196, 130", 0.3);
  blob(c, c, R * 0.15, "255, 226, 186", 0.42);
  blob(c, c, R * 0.05, "255, 246, 230", 0.55);

  return canvas;
}

/** The provided outbreak-planet artwork, used as-is (not repainted). */
const PLANET_SRC = "/images/outbreak-planet.png";

/**
 * Loads the planet artwork once and bakes a soft radial fade into its own
 * alpha channel (the same "fades to nothing at the edges" trick the
 * hand-painted galaxy gets for free from its gradients), so its square
 * frame never shows as a hard edge against the sky. Calls `onReady` once
 * it's usable.
 */
function loadPlanet(onReady: (bitmap: HTMLCanvasElement, aspect: number) => void): void {
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d")!;
    g.drawImage(img, 0, 0, w, h);
    g.globalCompositeOperation = "destination-in";
    const cx = w * 0.52;
    const cy = h * 0.46;
    const r = Math.max(w, h) * 0.5;
    const fade = g.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 0.62);
    fade.addColorStop(0, "rgba(0, 0, 0, 1)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, w, h);
    onReady(canvas, w / h);
  };
  img.src = PLANET_SRC;
}

/** Fixed, decorative star layer with a distant galaxy, the outbreak's own dying planet, and the odd meteor. Static under prefers-reduced-motion. */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = window.innerWidth;
    let height = window.innerHeight;
    // The sky is a fixed patch of stars as big as the screen, drawn on a canvas
    // of that size pinned to the top-left. Resizing the window only shows more
    // or less of it: nothing stretches, nothing moves, nothing is redrawn
    // mid-resize. If the window outgrows it (an external monitor), the sky
    // grows and only the new strip gets stars.
    const sky = { w: 0, h: 0 };
    const stars: Star[] = [];
    const growSky = (w: number, h: number) => {
      if (w > sky.w) {
        stars.push(...createStars(sky.w, 0, w, sky.h));
        sky.w = w;
      }
      if (h > sky.h) {
        stars.push(...createStars(0, sky.h, sky.w, h));
        sky.h = h;
      }
    };
    growSky(
      Math.max(window.innerWidth, window.screen.width || 0),
      Math.max(window.innerHeight, window.screen.height || 0),
    );
    const galaxy = paintGalaxy();
    const glows = TINTS.map(glowSprite);
    let planet: HTMLCanvasElement | null = null;
    let planetAspect = 1;
    loadPlanet((bitmap, aspect) => {
      planet = bitmap;
      planetAspect = aspect;
      draw(performance.now());
    });
    let meteor: Meteor | null = null;
    let nextMeteor = performance.now() + 4000;
    let frame = 0;

    let dpr = 0;
    /** Match the canvas to the sky (not the window). Only needed when the sky grows or the pixel density changes. */
    const fitCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(sky.w * dpr);
      canvas.height = Math.round(sky.h * dpr);
      canvas.style.width = `${sky.w}px`;
      canvas.style.height = `${sky.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fitCanvas();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const before = { w: sky.w, h: sky.h };
      growSky(width, height);
      const grew = sky.w !== before.w || sky.h !== before.h;
      if (grew || Math.min(window.devicePixelRatio || 1, 2) !== dpr) {
        fitCanvas();
        draw(performance.now());
      }
    };

    const draw = (time: number) => {
      // The whole sky, not just the window, so a bigger window never reveals a stale strip.
      ctx.clearRect(0, 0, sky.w, sky.h);
      const scroll = window.scrollY;
      const t = motion.matches ? 0 : time / 1000;

      for (const star of stars) {
        // Scroll parallax wraps around the whole sky, so it doesn't depend on the window's height.
        const shift = scroll * star.depth * 0.12;
        const y = (((star.y - shift) % sky.h) + sky.h) % sky.h;
        const b = star.brightness;

        // Twinkle: a slow drift, a medium waver and a quick flicker layered
        // together, so it's irregular like air turbulence. Bright stars
        // shimmer more; faint ones barely move.
        let twinkle = 1;
        if (!motion.matches) {
          const [r1, r2, r3] = star.rates;
          const [p1, p2, p3] = star.phases;
          const flicker =
            0.5 * Math.sin(t * r1 + p1) + 0.32 * Math.sin(t * r2 + p2) + 0.18 * Math.sin(t * r3 + p3);
          twinkle = 1 + flicker * (0.18 + 0.32 * b);
        }
        // Tops out below full opacity so even the brightest stars have room to shimmer.
        const alpha = Math.max(0, Math.min(1, (0.26 + 0.6 * b) * twinkle));

        if (b > BRIGHT_HALO) {
          // Halo, sized and faded with brightness.
          const halo = 6 + 14 * (b - BRIGHT_HALO) / (1 - BRIGHT_HALO);
          ctx.globalAlpha = alpha * 0.9;
          ctx.drawImage(glows[star.tintIndex], star.x - halo, y - halo, halo * 2, halo * 2);
          ctx.globalAlpha = 1;
          if (b > BRIGHT_RAYS) {
            // Faint cross-shaped rays, like a bright star in a photo.
            const ray = 5 + 9 * twinkle * (b - BRIGHT_RAYS) / (1 - BRIGHT_RAYS);
            ctx.fillStyle = `rgba(${star.tint}, ${alpha * 0.35})`;
            ctx.fillRect(star.x - ray, y - 0.35, ray * 2, 0.7);
            ctx.fillRect(star.x - 0.35, y - ray, 0.7, ray * 2);
          }
        }

        // The star itself: a crisp point, a touch larger for the bright ones.
        const size = 0.9 + 1.5 * b;
        ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
        if (size < 1.6) {
          ctx.fillRect(star.x - size / 2, y - size / 2, size, size);
        } else {
          ctx.beginPath();
          ctx.arc(star.x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawGalaxy(t, scroll);
      drawPlanet(scroll);
      if (!motion.matches) drawMeteor(time);
    };

    /**
     * A tilted spiral low on the left, drifting slower than the stars on scroll.
     * Placed on the sky (the screen), not the window, so it stays put on resize.
     */
    const drawGalaxy = (t: number, scroll: number) => {
      const size = Math.min(Math.max(sky.w, sky.h) * 0.21, 290);
      const cx = sky.w * (sky.w < 640 ? 0.2 : 0.12);
      const cy = Math.min(sky.h * 0.72, sky.h - size * 0.3) - scroll * 0.02;
      const tilt = -0.45;
      const squash = 0.5; // the disc seen at an angle
      const scale = (size * 2) / GALAXY_PX;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.scale(scale, scale * squash);
      ctx.rotate(t * GALAXY_SPIN);
      // Dimmer on phones, where it sits right behind the text.
      ctx.globalAlpha = sky.w < 640 ? 0.4 : 0.7;
      ctx.drawImage(galaxy, -GALAXY_PX / 2, -GALAXY_PX / 2);
      ctx.restore();
    };

    /**
     * The outbreak world, high on the left — above the galaxy, same side of
     * the sky. Drifts slower than the stars on scroll. A no-op until the
     * artwork finishes loading.
     */
    const drawPlanet = (scroll: number) => {
      if (!planet) return;
      const w = Math.min(Math.max(sky.w, sky.h) * 0.15, 200);
      const h = w / planetAspect;
      const cx = sky.w * (sky.w < 640 ? 0.24 : 0.15);
      const cy = Math.max(h * 0.55, sky.h * 0.13) - scroll * 0.015;

      ctx.save();
      // Dimmer on phones, where it sits right behind the text.
      ctx.globalAlpha = sky.w < 640 ? 0.55 : 0.85;
      ctx.drawImage(planet, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
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

    draw(performance.now());
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
