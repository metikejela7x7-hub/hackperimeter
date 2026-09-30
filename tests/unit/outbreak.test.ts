import { describe, expect, it } from "vitest";
import { HUBS, OUTBREAK_TOTAL } from "@/data/outbreak";
import towns from "@/data/outbreakTowns.json";

describe("outbreak data", () => {
  it("has exactly as many places as the counter says (regenerate towns if this fails)", () => {
    expect(HUBS.length + towns.length).toBe(OUTBREAK_TOTAL);
  });

  it("starts in Atlanta", () => {
    expect(HUBS[0]).toEqual([-84.4, 33.7]);
  });

  it("ties every town to a real hub, on the globe", () => {
    for (const [lon, lat, hub] of towns as [number, number, number, number][]) {
      expect(hub).toBeGreaterThanOrEqual(0);
      expect(hub).toBeLessThan(HUBS.length);
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }
  });
});
