"use client";

import { useEffect, useRef } from "react";
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110m from "world-atlas/land-110m.json";
import { HUBS } from "@/data/outbreak";
import outbreakTowns from "@/data/outbreakTowns.json";
import styles from "./Hero.module.css";
import { publishInfected } from "./outbreakCount";

/** Globe centre and radius, in the hero graphic's 800×800 viewBox. */
const CX = 400;
const CY = 400;
const R = 112;

/** Natural Earth coastlines at 1:110m: accurate at this size and ~55 KB. */
const topology = land110m as unknown as Topology<{ land: GeometryCollection }>;
const LAND = feature(topology, topology.objects.land);
const GRATICULE = geoGraticule10();

/**
 * Where the sun is directly overhead right now, as [longitude, latitude].
 * Accurate to about a degree, plenty for a line on a 224px globe.
 */
function subsolarPoint(date: Date): [number, number] {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = (date.getTime() - startOfYear) / 86_400_000;
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const longitude = ((((12 - utcHours) * 15 + 180) % 360) + 360) % 360 - 180;
  return [longitude, declination];
}

/** The night hemisphere (filled) and its edge, the day/night line (stroked). */
function nightShapes(date: Date) {
  const [sunLon, sunLat] = subsolarPoint(date);
  const night = geoCircle()
    .center([sunLon + 180, -sunLat])
    .radius(90)
    .precision(2)();
  const terminator = { type: "LineString" as const, coordinates: night.coordinates[0] };
  return { night, terminator };
}

const ATLANTA = HUBS[0];
/** Tilt of the north pole towards the viewer, degrees. */
const TILT = 22;
/**
 * Seconds per turn, and per outbreak: each cycle starts with Atlanta facing
 * us, the infection spreads east as the planet turns, then counts back down.
 */
const CYCLE = 60;
/** The count runs back down to zero between these points in the cycle; the globe then sits clean until it restarts. */
const TICK_DOWN = [0.9, 0.975] as const;
/** Countdown speed: starts at this many per second (one per frame, so each number shows), then accelerates. */
const TICK_DOWN_START_RATE = 60;
/** Degrees east of the globe's centre line where a hub catches it: in view, on the incoming side. */
const CATCH_LEAD = 30;
/** Smallest gap between two hubs catching it, as a share of the cycle (0.3 s). */
const CATCH_GAP = 0.005;
/** Seconds a newly infected place flares before settling. */
const FLARE = 0.6;

const TOWNS = outbreakTowns as [number, number, number, number][];

interface Place {
  coords: [number, number];
  /** When it's infected, as a share of the cycle. */
  at: number;
  /** Its position in infection order: the counter shows how many are infected. */
  rank: number;
  /** Index into HUBS, or -1 for a town. */
  hub: number;
}

/**
 * Every place and when it's infected. Hubs catch it as they turn into view
 * (or at once if already facing us), in order. Their towns follow within a
 * second or two, nearest first, so the counter climbs as each cluster fills in.
 */
const PLACES: readonly Place[] = (() => {
  let previous = -CATCH_GAP;
  const hubAt = HUBS.map(([longitude]) => {
    const eastOfStart = ((((longitude - ATLANTA[0] - CATCH_LEAD + 90) % 360) + 360) % 360) - 90;
    previous = Math.max(previous + CATCH_GAP, eastOfStart / 360);
    return previous;
  });
  const latest = TICK_DOWN[0] - 0.02;
  const places: Omit<Place, "rank">[] = [
    ...HUBS.map((coords, hub) => ({ coords, at: Math.min(hubAt[hub], latest), hub })),
    ...TOWNS.map(([lon, lat, hub, degrees], i) => ({
      coords: [lon, lat] as [number, number],
      at: Math.min(hubAt[hub] + 0.004 + (degrees / 5) * 0.02 + ((i * 7919) % 97) / 97 * 0.006, latest),
      hub: -1,
    })),
  ];
  return places
    .map((place, index) => ({ place, index }))
    .sort((p, q) => p.place.at - q.place.at || p.index - q.index)
    .map(({ place }, rank) => ({ ...place, rank }));
})();
const INFECTION_TIMES = PLACES.map((place) => place.at).sort((p, q) => p - q);

/**
 * Places infected at a point in the cycle. On the way down it starts one per
 * frame (1106, 1105, 1104…) and speeds up to reach zero on time.
 */
function infectedCount(cycle: number): number {
  if (cycle >= TICK_DOWN[1]) return 0;
  if (cycle < TICK_DOWN[0]) {
    let count = 0;
    while (count < INFECTION_TIMES.length && INFECTION_TIMES[count] <= cycle) count += 1;
    return count;
  }
  const total = PLACES.length;
  const elapsed = (cycle - TICK_DOWN[0]) * CYCLE;
  const duration = (TICK_DOWN[1] - TICK_DOWN[0]) * CYCLE;
  const accel = (total - TICK_DOWN_START_RATE * duration) / duration ** 3;
  return Math.max(0, total - Math.floor(TICK_DOWN_START_RATE * elapsed + accel * elapsed ** 3));
}

const HUB_PLACES = PLACES.filter((place) => place.hub >= 0).sort((p, q) => p.hub - q.hub);
const TOWN_PLACES = PLACES.filter((place) => place.hub < 0);

/** A small circle as path data, so many dots can share one element. */
const dot = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/**
 * Rotating Earth: minimalist coastlines, the real day/night line for this
 * moment, and an outbreak spreading from Atlanta.
 */
export function Globe() {
  const landRef = useRef<SVGPathElement>(null);
  const graticuleRef = useRef<SVGPathElement>(null);
  const nightRef = useRef<SVGPathElement>(null);
  const terminatorRef = useRef<SVGPathElement>(null);
  const sites = useRef<(SVGGElement | null)[]>([]);
  const townsRef = useRef<SVGPathElement>(null);
  const freshRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const projection = geoOrthographic()
      .scale(R)
      .translate([CX, CY])
      .clipAngle(90)
      .precision(0.6);
    const path = geoPath(projection);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    // The sun barely moves in a minute; recompute the night side once a minute.
    let shadow = nightShapes(new Date());
    let shadowAt = Date.now();

    const draw = (seconds: number) => {
      const cycle = (seconds % CYCLE) / CYCLE;
      // Turn eastward from Atlanta so newly infected regions roll into view.
      const centreLon = ATLANTA[0] + cycle * 360;
      const centre: [number, number] = [centreLon, TILT];
      projection.rotate([-centreLon, -TILT]);

      if (Date.now() - shadowAt > 60_000) {
        shadow = nightShapes(new Date());
        shadowAt = Date.now();
      }
      landRef.current?.setAttribute("d", path(LAND) ?? "");
      graticuleRef.current?.setAttribute("d", path(GRATICULE) ?? "");
      nightRef.current?.setAttribute("d", path(shadow.night) ?? "");
      terminatorRef.current?.setAttribute("d", path(shadow.terminator) ?? "");

      // Readout and dots share one count: they climb together as places turn
      // into view, and fall together (last infected first) on the way down.
      const infected = infectedCount(cycle);
      publishInfected(infected); // the hero's readout (OutbreakReadout) shows it
      const flaring = cycle < TICK_DOWN[0];

      // Hubs: individual markers with a pulse ring, flaring when they catch it.
      sites.current.forEach((site, hub) => {
        if (!site) return;
        const place = HUB_PLACES[hub];
        const point = projection(place.coords);
        const facing = Math.cos(geoDistance(place.coords, centre)); // 1 = facing us, <0 = far side
        if (!point || facing <= 0.05 || place.rank >= infected) {
          site.style.opacity = "0";
          return;
        }
        const age = (cycle - place.at) * CYCLE;
        const flare = flaring ? Math.max(0, 1 - age / FLARE) : 0;
        site.setAttribute(
          "transform",
          `translate(${point[0].toFixed(2)} ${point[1].toFixed(2)}) scale(${(1 + 1.4 * flare).toFixed(2)})`,
        );
        site.style.opacity = String(Math.min(1, facing * 2.5));
      });

      // Towns: one path for all of them, plus one for those that just caught it.
      let settled = "";
      let fresh = "";
      for (const place of TOWN_PLACES) {
        if (place.rank >= infected || geoDistance(place.coords, centre) > 1.5) continue;
        const point = projection(place.coords);
        if (!point) continue;
        const age = (cycle - place.at) * CYCLE;
        if (flaring && age < FLARE) fresh += dot(point[0], point[1], 1.5);
        else settled += dot(point[0], point[1], 0.75);
      }
      townsRef.current?.setAttribute("d", settled);
      freshRef.current?.setAttribute("d", fresh);
    };

    const loop = (time: number) => {
      draw(time / 1000);
      frame = requestAnimationFrame(loop);
    };

    let onScreen = true;
    const start = () => {
      cancelAnimationFrame(frame);
      if (motion.matches) {
        draw(CYCLE * 0.2); // still frame: the Americas infected, Europe catching it
      } else if (onScreen && !document.hidden) {
        frame = requestAnimationFrame(loop);
      } else {
        draw(performance.now() / 1000); // off-screen or in a background tab: one frame, then rest
      }
    };

    // Redrawing the map and ~1,100 dots every frame is real work: only do it while the globe is visible.
    const svg = landRef.current?.ownerSVGElement;
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
  }, []);

  return (
    <g>
      <path ref={graticuleRef} className={styles.graticule} />
      <path ref={landRef} className={styles.land} />
      <path ref={nightRef} className={styles.night} />
      <path ref={terminatorRef} className={styles.terminator} />
      <path ref={townsRef} className={styles.towns} />
      <path ref={freshRef} className={styles.townsFresh} />
      {HUBS.map((_, i) => (
        <g
          key={i}
          style={{ opacity: 0 }}
          ref={(el) => {
            sites.current[i] = el;
          }}
        >
          <circle className={styles.sitePulse} r="3" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
          <circle className={i === 0 ? styles.siteOrigin : styles.siteDot} r={i === 0 ? 2.2 : 1.5} />
        </g>
      ))}
    </g>
  );
}
