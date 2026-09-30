/**
 * Scatters the outbreak's towns around its hub cities, on land only, and writes
 * src/data/outbreakTowns.json. Done ahead of time because land tests are too
 * slow to run in the browser. Re-run after changing HUBS or OUTBREAK_TOTAL:
 *
 *   node scripts/generate-outbreak-towns.mjs
 *
 * Needs Node 23+ (imports the TypeScript data file directly).
 */
import { writeFileSync, readFileSync } from "node:fs";
import { geoContains, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import { HUBS, OUTBREAK_TOTAL } from "../src/data/outbreak.ts";

const topology = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topology, topology.objects.land);

// Deterministic, so re-running gives the same map.
let seed = 110626;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());

const towns = OUTBREAK_TOTAL - HUBS.length;
const base = Math.floor(towns / HUBS.length);
const extra = towns % HUBS.length;
const out = [];
let fallbacks = 0;

HUBS.forEach(([lon, lat], hub) => {
  const count = base + (hub < extra ? 1 : 0);
  for (let n = 0; n < count; n += 1) {
    let point = null;
    for (let attempt = 0; attempt < 60 && !point; attempt += 1) {
      const spread = 1.2 + 3.2 * rand(); // degrees: most towns close in, a few farther out
      const candidate = [
        lon + (gauss() * spread) / Math.max(0.35, Math.cos((lat * Math.PI) / 180)),
        Math.max(-58, Math.min(72, lat + gauss() * spread)),
      ];
      if (geoContains(land, candidate)) point = candidate;
    }
    if (!point) {
      // Small islands: stay close to the hub itself.
      point = [lon + (rand() - 0.5) * 0.6, lat + (rand() - 0.5) * 0.6];
      fallbacks += 1;
    }
    const degreesFromHub = (geoDistance(point, [lon, lat]) * 180) / Math.PI;
    out.push([+point[0].toFixed(2), +point[1].toFixed(2), hub, +degreesFromHub.toFixed(2)]);
  }
});

writeFileSync(
  new URL("../src/data/outbreakTowns.json", import.meta.url),
  JSON.stringify(out) + "\n",
);
console.log(`${out.length} towns around ${HUBS.length} hubs (${out.length + HUBS.length} total), ${fallbacks} placed at their hub`);
