import type { Metadata } from "next";
import { StarField } from "@/components/StarField/StarField";
import { ApplyHeader } from "@/components/ApplyHeader/ApplyHeader";
import { ApplyForm } from "@/components/ApplyForm/ApplyForm";
import { EVENT } from "@/data/event";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Apply to survive | HackPerimeter",
  description: `Apply to HackPerimeter, the first-ever Perimeter College hackathon. ${EVENT.dateLabel} at ${EVENT.venue} in Clarkston, GA.`,
};

/** Faint echo of the Hero's perimeter ring, so this page still reads as HackPerimeter and not a bare form. */
function PerimeterMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 800 800" aria-hidden="true" focusable="false">
      <g className={styles.markRing}>
        <circle cx="400" cy="400" r="360" className={styles.markLine} />
        <circle cx="400" cy="400" r="350" className={styles.markTicks} />
        <circle cx="400" cy="400" r="350" className={styles.markTicksMajor} />
      </g>
    </svg>
  );
}

export default function ApplyPage() {
  return (
    <>
      <StarField />
      <div className={styles.page}>
        <PerimeterMark />
        <ApplyHeader />
        <main id="main" className={styles.main}>
          <div className={styles.intro}>
            <p className={styles.kicker}>
              <span className={styles.kickerRule} aria-hidden="true" />
              Application
            </p>
            <h1 className={styles.title}>
              Apply to <em>survive</em>
            </h1>
            <p className={styles.lead}>
              Four short steps. {EVENT.dateLabel} · {EVENT.venue}, Clarkston, GA.
            </p>
          </div>

          <ApplyForm />
        </main>
        <footer className={styles.footer}>
          <p>© 2026 HackPerimeter. The first-ever Perimeter College hackathon.</p>
        </footer>
      </div>
    </>
  );
}
