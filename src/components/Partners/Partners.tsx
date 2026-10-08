"use client";

import { useState } from "react";
import { PARTNERS, type Partner } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Partners.module.css";

/**
 * A partner's logo, in its own real artwork and colours — never redrawn as
 * text. `iconOnly` pairs an icon-only mark with its name so it still reads
 * as a single logo (e.g. DUWUN's compass, which carries no lettering).
 * If the file isn't there yet, a quiet placeholder shows instead of the
 * logo — never the company name standing in for it.
 */
function Logo({ partner }: { partner: Partner }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <span className={styles.pending} role="img" aria-label={`${partner.name} — logo coming soon`} />;
  }

  const imgClass = partner.iconOnly
    ? styles.iconImg
    : partner.stacked
      ? `${styles.logoImg} ${styles.stackedImg}`
      : styles.logoImg;

  const img = (
    <img
      className={imgClass}
      src={partner.logo}
      alt={partner.iconOnly ? "" : partner.name}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );

  if (partner.iconOnly) {
    return (
      <span className={styles.iconLockup} role="img" aria-label={partner.name}>
        {img}
        <span className={styles.iconWordmark} aria-hidden="true">
          {partner.name}
        </span>
      </span>
    );
  }

  return img;
}

/** A logo, wrapped in a link to the partner's site when it has one. */
function PartnerLogo({ partner }: { partner: Partner }) {
  if (!partner.url) return <Logo partner={partner} />;
  return (
    <a
      className={styles.logoLink}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={partner.name}
    >
      <Logo partner={partner} />
    </a>
  );
}

/**
 * One wide glass panel holding every logo in a single evenly-spaced row
 * (a 2x2 grid on small screens), with a quiet "more partners" note built
 * into its bottom edge instead of a separate card.
 */
export function Partners() {
  const logos = useReveal<HTMLUListElement>();

  return (
    <section id="partners" className={styles.section} aria-labelledby="partners-title">
      <div className={styles.inner}>
        <SectionHeading
          id="partners-title"
          index="04"
          eyebrow="Partners & sponsors"
          title="Backing the crew"
        />

        <div className={styles.panel}>
          <ul ref={logos.ref} className={`${styles.logos} reveal-group`} data-visible={logos.visible}>
            {PARTNERS.map((partner, i) => (
              <li key={partner.name} className={styles.logoItem} style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.stack}>
                  <PartnerLogo partner={partner} />
                  {partner.below && <PartnerLogo partner={partner.below} />}
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <span className={styles.footerLine} aria-hidden="true" />
            <span className={styles.footerText}>More partners joining soon</span>
            <span className={styles.footerLine} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
