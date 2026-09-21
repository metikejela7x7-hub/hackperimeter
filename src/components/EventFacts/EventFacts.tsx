import { EVENT } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import styles from "./EventFacts.module.css";

const DETAILS = [
  { term: "Date", value: EVENT.dateLabel },
  { term: "Time", value: EVENT.timeLabel },
  { term: "Venue", value: EVENT.venue, sub: EVENT.address },
  { term: "Finale", value: "On-site interviews for the top three teams" },
] as const;

export function EventFacts() {
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
          <div className={styles.numbers}>
            <p className={styles.prize}>
              <span className={styles.prizeValue}>{EVENT.prize}</span>
              <span className={styles.numLabel}>Cash-prize pool</span>
            </p>
            <div className={styles.pair}>
              <p className={styles.stat}>
                <span className={styles.statValue}>12</span>
                <span className={styles.numLabel}>Hours on the clock</span>
              </p>
              <p className={styles.stat}>
                <span className={styles.statValue}>{EVENT.teamSize}</span>
                <span className={styles.numLabel}>Teammates per crew</span>
              </p>
            </div>
          </div>

          <dl className={styles.details}>
            {DETAILS.map((item) => (
              <div key={item.term} className={styles.row}>
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
