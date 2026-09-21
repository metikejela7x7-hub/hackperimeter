import { PARTNERS } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import styles from "./Partners.module.css";

export function Partners() {
  return (
    <section id="partners" className={styles.section} aria-labelledby="partners-title">
      <div className={styles.inner}>
        <SectionHeading
          id="partners-title"
          index="04"
          eyebrow="Partners & sponsors"
          title="Backing the crew"
        />

        <ul className={styles.list}>
          {PARTNERS.map((partner) => (
            <li key={partner.name} className={styles.item}>
              <span className={styles.name}>{partner.name}</span>
              <span className={styles.role}>{partner.role}</span>
            </li>
          ))}
          <li className={`${styles.item} ${styles.open}`}>
            <span className={styles.slot} aria-hidden="true" />
            <span className={styles.openText}>More partners joining soon</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
