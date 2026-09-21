import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
}

export function SectionHeading({ id, index, eyebrow, title }: SectionHeadingProps) {
  return (
    <header className={styles.heading}>
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
