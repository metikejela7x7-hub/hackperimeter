"use client";

import { PARTNERS } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Partners.module.css";

export function Partners() {
  const list = useReveal<HTMLUListElement>();

  return (
    <section id="partners" className={styles.section} aria-labelledby="partners-title">
      <div className={styles.inner}>
        <SectionHeading
          id="partners-title"
          index="04"
          eyebrow="Partners & sponsors"
          title="Backing the crew"
        />

        <ul ref={list.ref} className={`${styles.list} reveal-group`} data-visible={list.visible}>
          {PARTNERS.map((partner, i) => (
            <li key={partner.name} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.name}>{partner.name}</span>
              <span className={styles.role}>{partner.role}</span>
            </li>
          ))}
          <li
            className={`${styles.item} ${styles.open}`}
            style={{ "--i": PARTNERS.length } as React.CSSProperties}
          >
            <span className={styles.slot} aria-hidden="true" />
            <span className={styles.openText}>More partners joining soon</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
