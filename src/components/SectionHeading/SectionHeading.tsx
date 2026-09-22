"use client";

import { useReveal } from "@/hooks/useReveal";
import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
}

export function SectionHeading({ id, index, eyebrow, title }: SectionHeadingProps) {
  const { ref, visible } = useReveal<HTMLElement>();

  return (
    <header ref={ref} className={`${styles.heading} reveal`} data-visible={visible}>
      <p className={styles.eyebrow}>
        <span className={styles.index}>{index}</span>
        <span className={styles.rule} aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
    </header>
  );
}
