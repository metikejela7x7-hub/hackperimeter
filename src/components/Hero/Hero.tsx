import { APPLY_URL, EVENT } from "@/data/event";
import { Button } from "@/components/Button/Button";
import { Countdown } from "@/components/Countdown/Countdown";
import { Globe } from "./Globe";
import { Moon } from "./Moon";
import { OutbreakReadout } from "./OutbreakReadout";
import styles from "./Hero.module.css";

/** Decorative perimeter ring, rotating Earth mid-outbreak, its moon, orbits and a pulsing signal. */
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
        {/* Moon: sunlit from the upper left, falling into shadow on the far side */}
        <radialGradient id="moon-surface" cx="36%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ece8de" />
          <stop offset="55%" stopColor="#b3aea4" />
          <stop offset="100%" stopColor="#5d5a54" />
        </radialGradient>
        <radialGradient id="moon-shadow" cx="28%" cy="24%" r="95%">
          <stop offset="55%" stopColor="#0c0d0e" stopOpacity="0" />
          <stop offset="100%" stopColor="#0c0d0e" stopOpacity="0.85" />
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

      {/* The moon behind Earth on the far half of its orbit, in front on the near half */}
      <Moon layer="back" />
      <circle cx="400" cy="400" r="112" fill="url(#planet)" className={styles.planet} />
      <Globe />
      <Moon layer="front" />

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
      {/* Solid discs behind the globe and the moon: the graphic is see-through,
          so without these the background stars would show through them. */}
      <svg className={`${styles.graphic} ${styles.globeBacking}`} viewBox="0 0 800 800" aria-hidden="true" focusable="false">
        <circle cx="400" cy="400" r="113" />
        <Moon layer="backing" />
      </svg>
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
          <OutbreakReadout />
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
