import { SCHEDULE, SCHEDULE_NOTE } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import styles from "./Schedule.module.css";

export function Schedule() {
  return (
    <section id="schedule" className={styles.section} aria-labelledby="schedule-title">
      <div className={styles.inner}>
        <div className={styles.lead}>
          <SectionHeading
            id="schedule-title"
            index="03"
            eyebrow="Run of show"
            title="The day in hours"
          />
          <p className={styles.note}>{SCHEDULE_NOTE}</p>
        </div>

        <ol className={styles.timeline}>
          {SCHEDULE.map((item) => (
            <li
              key={item.time}
              className={styles.item}
              data-milestone={item.milestone ? "true" : undefined}
            >
              <time className={styles.time}>{item.time}</time>
              <div className={styles.text}>
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.detail}>{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
