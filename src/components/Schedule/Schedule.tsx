"use client";

import { SCHEDULE, SCHEDULE_NOTE } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Schedule.module.css";

export function Schedule() {
  const timeline = useReveal<HTMLOListElement>();

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

        <ol
          ref={timeline.ref}
          className={`${styles.timeline} reveal-group`}
          data-visible={timeline.visible}
        >
          {SCHEDULE.map((item, i) => (
            <li
              key={item.time}
              className={styles.item}
              data-milestone={item.milestone ? "true" : undefined}
              style={{ "--i": i } as React.CSSProperties}
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
