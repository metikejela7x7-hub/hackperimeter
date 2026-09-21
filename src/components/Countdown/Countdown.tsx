"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/data/event";
import styles from "./Countdown.module.css";

type Phase = "before" | "live" | "after";

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

function getPhase(now: number): Phase {
  if (now < EVENT.startsAt) return "before";
  if (now < EVENT.endsAt) return "live";
  return "after";
}

function split(ms: number): number[] {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [
    Math.floor(total / 86400),
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ];
}

const pad = (value: number) => String(value).padStart(2, "0");

const LABELS: Record<Phase, string> = {
  before: "Doors open in",
  live: "Time left to survive",
  after: "",
};

export function Countdown() {
  // null until mounted, so server and first client render match.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = now === null ? "before" : getPhase(now);

  if (phase === "after") {
    return (
      <div className={styles.countdown} role="timer">
        <p className={styles.label}>Mission complete</p>
        <p className={styles.closing}>The perimeter has closed. Thanks for surviving.</p>
      </div>
    );
  }

  const values =
    now === null
      ? null
      : split((phase === "before" ? EVENT.startsAt : EVENT.endsAt) - now);

  const summary = values
    ? `${values[0]} days, ${values[1]} hours, ${values[2]} minutes and ${values[3]} seconds ${
        phase === "before" ? "until HackPerimeter begins" : "left in HackPerimeter"
      }`
    : "Countdown loading";

  return (
    <div className={styles.countdown} role="timer" aria-label={LABELS[phase]}>
      <p className={styles.label}>
        <span className={styles.pulse} aria-hidden="true" />
        {LABELS[phase]}
      </p>
      <p className="sr-only">{summary}</p>
      <ol className={styles.units} aria-hidden="true">
        {UNITS.map((unit, i) => (
          <li key={unit} className={styles.unit}>
            <span className={styles.value}>{values ? pad(values[i]) : "––"}</span>
            <span className={styles.unitLabel}>{unit}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
