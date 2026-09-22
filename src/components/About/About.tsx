"use client";

import { EVENT } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./About.module.css";

const PRINCIPLES = [
  {
    title: "Stay together",
    text: "Crews of two to four. Nobody makes it off the planet alone.",
  },
  {
    title: "Stay on the clock",
    text: "Twelve hours, doors open to lights out. Every decision costs time.",
  },
  {
    title: "Stay ahead",
    text: "The top three teams are interviewed on-site before the day is over.",
  },
] as const;

export function About() {
  const copy = useReveal<HTMLDivElement>();
  const principles = useReveal<HTMLOListElement>();

  return (
    <section id="mission" className={styles.section} aria-labelledby="mission-title">
      <div className={styles.inner}>
        <div className={styles.lead}>
          <SectionHeading
            id="mission-title"
            index="02"
            eyebrow="The scenario"
            title="Earth is finished. You are not."
          />
          <p className={styles.slogan}>{EVENT.slogan}</p>
        </div>

        <div className={styles.copy}>
          <p ref={copy.ref} className={`${styles.story} reveal`} data-visible={copy.visible}>
            The perimeter has fallen. The last transports are fueling, the window is
            closing, and everything you can build in one day decides whether your crew is
            on board.
          </p>
          <p>
            HackPerimeter drops teams into that scenario for twelve hours at the first-ever
            Perimeter College hackathon. You bring a crew, a clock and a problem worth
            solving. Build the thing that gets you out.
          </p>

          <ol
            ref={principles.ref}
            className={`${styles.principles} reveal-group`}
            data-visible={principles.visible}
          >
            {PRINCIPLES.map((item, i) => (
              <li
                key={item.title}
                className={styles.principle}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.pTitle}>{item.title}</h3>
                  <p className={styles.pText}>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
