"use client";

import { useEffect, useRef } from "react";
import { OUTBREAK_TOTAL } from "@/data/outbreak";
import { subscribeInfected } from "./outbreakCount";
import styles from "./Hero.module.css";

/** "Infected 0415 / 1106 cities", kept in step with the dots on the globe. */
export function OutbreakReadout() {
  const countRef = useRef<HTMLSpanElement>(null);

  // Written straight to the DOM: it changes up to 60 times a second.
  useEffect(
    () =>
      subscribeInfected((count) => {
        if (countRef.current) countRef.current.textContent = String(count).padStart(4, "0");
      }),
    [],
  );

  return (
    <p className={styles.outbreak}>
      <span>
        Infected{" "}
        <span ref={countRef} className={styles.outbreakCount}>
          0001
        </span>{" "}
        / {OUTBREAK_TOTAL} cities
      </span>
      <span>Patient zero · Atlanta, GA</span>
    </p>
  );
}
