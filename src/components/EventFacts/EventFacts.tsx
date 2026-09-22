"use client";

import { EVENT } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Counter } from "@/components/Counter/Counter";
import { useReveal } from "@/hooks/useReveal";
import styles from "./EventFacts.module.css";

const DETAILS = [
  { term: "Date", value: EVENT.dateLabel },
  { term: "Time", value: EVENT.timeLabel },
  { term: "Venue", value: EVENT.venue, sub: EVENT.address },
  { term: "Finale", value: "On-site interviews for the top three teams" },
] as const;

export function EventFacts() {
  const numbers = useReveal<HTMLDivElement>();
  const details = useReveal<HTMLDListElement>();

  return (
    <section id="facts" className={styles.section} aria-labelledby="facts-title">
      <div className={styles.inner}>
        <SectionHeading
          id="facts-title"
          index="01"
          eyebrow="Event facts"
          title="Twelve hours. One window."
        />

        <div className={styles.body}>
          <div ref={numbers.ref} className={`${styles.numbers} reveal`} data-visible={numbers.visible}>
            <p className={styles.prize}>
              <span className={styles.prizeValue}>
                <Counter value={EVENT.prizeAmount} prefix="$" />
              </span>
              <span className={styles.numLabel}>Cash-prize pool</span>
            </p>
            <div className={styles.pair}>
              <p className={styles.stat}>
                <span className={styles.statValue}>
                  <Counter value={12} />
                </span>
                <span className={styles.numLabel}>Hours on the clock</span>
              </p>
              <p className={styles.stat}>
                <span className={styles.statValue}>{EVENT.teamSize}</span>
                <span className={styles.numLabel}>Teammates per crew</span>
              </p>
            </div>
          </div>

          <dl
            ref={details.ref}
            className={`${styles.details} reveal-group`}
            data-visible={details.visible}
          >
            {DETAILS.map((item, i) => (
              <div key={item.term} className={styles.row} style={{ "--i": i } as React.CSSProperties}>
                <dt className={styles.term}>{item.term}</dt>
                <dd className={styles.value}>
                  {item.value}
                  {"sub" in item && <span className={styles.sub}>{item.sub}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
