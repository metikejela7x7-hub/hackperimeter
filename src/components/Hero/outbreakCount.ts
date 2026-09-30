/**
 * The globe publishes how many places are infected; the hero's readout
 * subscribes. A tiny shared store, so the two stay in step however React
 * renders or refreshes either of them.
 */

type Listener = (count: number) => void;

let current = 1;
const listeners = new Set<Listener>();

export function publishInfected(count: number) {
  if (count === current) return;
  current = count;
  listeners.forEach((listener) => listener(count));
}

/** Calls `listener` with the current count now, then on every change. Returns an unsubscribe. */
export function subscribeInfected(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}
