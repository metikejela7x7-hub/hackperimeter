import styles from "./ApplyHeader.module.css";
import { HOME_URL } from "@/data/event";

/** Slim header for /apply. The homepage Navbar's links are in-page anchors, so it can't be reused here. */
export function ApplyHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href={HOME_URL} aria-label="HackPerimeter home">
          <svg
            className={styles.mark}
            viewBox="0 0 32 32"
            width="28"
            height="28"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <ellipse
              cx="16"
              cy="16"
              rx="13"
              ry="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
              transform="rotate(-28 16 16)"
            />
            <circle cx="26.2" cy="10.4" r="2.4" fill="var(--amber)" />
          </svg>
          <span className={styles.wordmark}>
            Hack<span>Perimeter</span>
          </span>
        </a>

        <a className={styles.back} href={HOME_URL} aria-label="Back to site">
          <span aria-hidden="true">←</span>
          <span>Back</span>
          <span className={styles.backMore}>to site</span>
        </a>
      </div>
    </header>
  );
}
