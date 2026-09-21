import { APPLY_URL, EVENT, NAV_LINKS } from "@/data/event";
import { Button } from "@/components/Button/Button";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.pitch}>
            <p className={styles.mark}>
              Hack<span>Perimeter</span>
            </p>
            <p className={styles.slogan}>{EVENT.slogan}</p>
            <Button href={APPLY_URL}>Apply to survive</Button>
          </div>

          <nav className={styles.col} aria-label="Footer">
            <h2 className={styles.colTitle}>Navigate</h2>
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a className={styles.link} href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <address className={styles.col}>
            <h2 className={styles.colTitle}>The mission</h2>
            <p>{EVENT.dateLabel}</p>
            <p>{EVENT.timeLabel}</p>
            <p className={styles.muted}>
              {EVENT.venue}
              <br />
              {EVENT.address}
            </p>
          </address>
        </div>

        <div className={styles.bottom}>
          <p>© 2026 HackPerimeter. The first-ever Perimeter College hackathon.</p>
          <a className={styles.link} href="#top">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
