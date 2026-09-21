import { APPLY_URL, EVENT } from "@/data/event";
import { Button } from "@/components/Button/Button";
import { Countdown } from "@/components/Countdown/Countdown";
import styles from "./Hero.module.css";

/** Decorative perimeter ring, wireframe Earth, orbits and a pulsing signal. */
function OrbitGraphic() {
  return (
    <svg
      className={styles.graphic}
      viewBox="0 0 800 800"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="planet" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#24262a" />
          <stop offset="100%" stopColor="#0c0d0e" />
        </radialGradient>
      </defs>

      {/* Perimeter ring: fine ticks with heavier marks every tenth */}
      <g className={styles.ring}>
        <circle cx="400" cy="400" r="360" className={styles.ringLine} />
        <circle cx="400" cy="400" r="350" className={styles.ticks} />
        <circle cx="400" cy="400" r="350" className={styles.ticksMajor} />
        <path
          className={styles.sweep}
          d="M 400 40 A 360 360 0 0 1 759.4 380"
        />
      </g>

      {/* Orbits */}
      <g transform="rotate(-24 400 400)">
        <ellipse cx="400" cy="400" rx="290" ry="105" className={styles.orbit} />
      </g>
      <g transform="rotate(16 400 400)">
        <ellipse cx="400" cy="400" rx="230" ry="80" className={styles.orbitFaint} />
      </g>

      {/* Wireframe Earth: the thing being left behind */}
      <circle cx="400" cy="400" r="112" fill="url(#planet)" className={styles.planet} />
      <g className={styles.globe}>
        <ellipse cx="400" cy="400" rx="112" ry="38" />
        <ellipse cx="400" cy="400" rx="112" ry="76" />
        <ellipse cx="400" cy="400" rx="38" ry="112" />
        <ellipse cx="400" cy="400" rx="76" ry="112" />
        <line x1="400" y1="288" x2="400" y2="512" />
        <line x1="288" y1="400" x2="512" y2="400" />
      </g>
      <path
        className={styles.limb}
        d="M 322 322 A 112 112 0 0 1 478 322"
      />

      {/* Craft leaving on the outer orbit */}
      <g transform="rotate(-24 400 400)">
        <circle className={styles.craft} r="5" />
      </g>

      {/* Signal beacon on the ring */}
      <g transform="translate(655 145)">
        <circle className={styles.signal} r="6" />
        <circle className={`${styles.signal} ${styles.signalLate}`} r="6" />
        <circle r="3.5" className={styles.beacon} />
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <OrbitGraphic />

      <div className={styles.inner}>
        <p className={styles.kicker}>
          <span className={styles.kickerDot} aria-hidden="true" />
          The first-ever Perimeter College hackathon
        </p>

        <h1 id="hero-title" className={styles.title}>
          <span>Escape</span>
          <span>from</span>
          <span>
            Earth<em>.</em>
          </span>
        </h1>

        <p className={styles.slogan}>{EVENT.slogan}</p>

        <div className={styles.actions}>
          <Button href={APPLY_URL} size="lg">
            Apply to survive
          </Button>
          <Button href="#mission" variant="ghost" size="lg">
            Read the briefing
          </Button>
        </div>

        <div className={styles.bottom}>
          <Countdown />
          <p className={styles.where}>
            <span>{EVENT.dateLabel}</span>
            <span>
              {EVENT.venue}, Clarkston, GA
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
