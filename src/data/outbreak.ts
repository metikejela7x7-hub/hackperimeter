/**
 * The outbreak on the hero globe: 66 major cities ("hubs") plus the towns
 * around them (outbreakTowns.json), 1,106 places in all for the event date, 11/06.
 * Coordinates are [longitude, latitude].
 */

/**
 * Major cities, in the order they are infected:
 * Clarkston first, then outward and eastward as the planet turns them into view.
 */
export const HUBS: readonly [number, number][] = [
  [-84.24, 33.81], // Clarkston, GA: patient zero, and the event venue
  [-86.8, 33.5], [-80.8, 35.2], [-90.1, 30], [-77, 38.9], [-83, 42.3], [-87.6, 41.9],
  [-74, 40.7], [-80.2, 25.8], [-97.7, 30.3], [-71.1, 42.4], [-73.6, 45.5], [-79.4, 43.7],
  [-105, 39.7], [-99.1, 19.4], [-112.1, 33.4], [-122.4, 37.8], [-118.2, 34.1], [-122.3, 47.6],
  [-82.4, 23.1], [-66.9, 10.5], [-74.1, 4.7], [-77, -12], [-46.6, -23.5], [-58.4, -34.6],
  [-47.9, -15.8], [-70.7, -33.4], [-0.1, 51.5], [-6.3, 53.3], [2.35, 48.9], [-3.7, 40.4],
  [13.4, 52.5], [12.5, 41.9], [-9.1, 38.7], [10.8, 59.9], [30.5, 50.4], [37.6, 55.8],
  [29, 41], [31.2, 30], [-17.4, 14.7], [3.4, 6.5], [38.7, 9], [36.8, -1.3],
  [28, -26.2], [18.4, -33.9], [44.4, 33.3], [55.3, 25.3], [67, 24.9], [77.2, 28.6],
  [72.9, 19.1], [80.3, 13.1], [90.4, 23.8], [100.5, 13.8], [103.8, 1.35], [106.8, -6.2],
  [114.2, 22.3], [121.5, 31.2], [116.4, 39.9], [127, 37.6], [139.7, 35.7], [121, 14.6],
  [153, -27.5], [151.2, -33.9], [145, -37.8], [174.8, -36.8], [-149.9, 61.2],
];

/** Total places the counter counts to: hubs plus towns. Matches outbreakTowns.json. */
export const OUTBREAK_TOTAL = 1106;
