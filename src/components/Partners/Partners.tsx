"use client";

import { Cormorant_Garamond } from "next/font/google";
import { PARTNERS, type Partner } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Partners.module.css";

/** Zoku's wordmark face (as on zoku.app): Cormorant Garamond, semi-bold, widely spaced capitals. */
const zokuFace = Cormorant_Garamond({ subsets: ["latin"], weight: "600", display: "swap" });

/**
 * A miniature of IBM Z's campaign waves: indigo and magenta line fans
 * twisting past each other. Colours sampled from IBM Z's own artwork.
 */
function IbmRibbon() {
  const lines = Array.from({ length: 11 }, (_, i) => i / 10);
  return (
    <svg className={styles.ribbon} viewBox="0 0 160 18" aria-hidden="true" focusable="false">
      <g className={styles.ribbonIndigo}>
        {lines.map((t) => (
          <path key={t} d={`M0 ${(2 + t * 5).toFixed(1)} C45 ${(1 + t * 3).toFixed(1)} 105 ${(17 - t * 4).toFixed(1)} 160 ${(9 + t * 6).toFixed(1)}`} />
        ))}
      </g>
      <g className={styles.ribbonMagenta}>
        {lines.map((t) => (
          <path key={t} d={`M0 ${(11 + t * 5).toFixed(1)} C45 ${(17 - t * 3).toFixed(1)} 105 ${(1 + t * 4).toFixed(1)} 160 ${(3 + t * 5).toFixed(1)}`} />
        ))}
      </g>
    </svg>
  );
}

function Mark({ partner }: { partner: Partner }) {
  if (partner.wordmark === "zoku") {
    return (
      <span className={`${styles.zoku} ${zokuFace.className}`} role="img" aria-label={partner.name}>
        {/* one span per letter, so they can lift in a wave on hover */}
        {[..."Zoku"].map((letter, i) => (
          <span key={i} className={styles.zokuLetter} style={{ "--l": i } as React.CSSProperties} aria-hidden="true">
            {letter}
          </span>
        ))}
      </span>
    );
  }
  if (partner.logo && partner.ribbon) {
    return (
      <span className={styles.lockup}>
        <img className={styles.logo} src={partner.logo} alt={partner.name} loading="lazy" />
        <IbmRibbon />
      </span>
    );
  }
  if (partner.logo && partner.showName) {
    return (
      <span className={styles.lockup}>
        <img className={styles.icon} src={partner.logo} alt="" loading="lazy" />
        <span className={styles.lockupName}>{partner.name}</span>
      </span>
    );
  }
  if (partner.logo && partner.accent) {
    return (
      <span className={styles.stack}>
        <img className={styles.logo} src={partner.logo} alt={partner.name} loading="lazy" />
        <img
          className={styles.accent}
          src={partner.accent.src}
          alt=""
          loading="lazy"
          style={{ transformOrigin: partner.accent.pivot }}
        />
      </span>
    );
  }
  return partner.logo ? (
    <img className={styles.logo} src={partner.logo} alt={partner.name} loading="lazy" />
  ) : (
    <span className={styles.name}>{partner.name}</span>
  );
}

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

        <ul ref={list.ref} className={`${styles.grid} reveal-group`} data-visible={list.visible}>
          {PARTNERS.map((partner, i) => (
            <li key={partner.name} className={styles.tile} style={{ "--i": i } as React.CSSProperties}>
              {partner.url ? (
                <a className={styles.mark} href={partner.url} target="_blank" rel="noopener noreferrer">
                  <Mark partner={partner} />
                </a>
              ) : (
                <span className={styles.mark}>
                  <Mark partner={partner} />
                </span>
              )}
              <span className={styles.role}>{partner.role}</span>
            </li>
          ))}
          <li
            className={`${styles.tile} ${styles.open}`}
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
