"use client";

import { useEffect, useRef } from "react";
import { EVENT } from "@/data/event";
import { Button } from "@/components/Button/Button";
import styles from "./Confirmation.module.css";

interface ConfirmationProps {
  name: string;
  email: string;
}

export function Confirmation({ name, email }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstName = name.trim().split(/\s+/)[0];

  // Move focus to the confirmation so screen readers announce it and the
  // page starts at the top after the form disappears.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.card} aria-labelledby="apply-confirmation-title">
      <svg
        className={styles.badge}
        viewBox="0 0 64 64"
        width="64"
        height="64"
        aria-hidden="true"
        focusable="false"
      >
        <circle className={styles.sweep} cx="32" cy="32" r="30" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="1"
          strokeDasharray="1 5"
          transform="scale(0.8) translate(8 8)"
        />
        <path
          className={styles.tick}
          d="m20 33 8 8 16-18"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="3"
          strokeLinecap="square"
        />
      </svg>

      <p className={styles.eyebrow}>Application received</p>
      <h2 id="apply-confirmation-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        {firstName ? `You're on the radar, ${firstName}.` : "You're on the radar."}
      </h2>
      <p className={styles.lead}>
        We&rsquo;ve got your application for {EVENT.name}. Keep an eye on{" "}
        <strong className={styles.email}>{email.trim()}</strong> for what happens next.
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>When</dt>
          <dd>
            {EVENT.dateLabel}
            <br />
            {EVENT.timeLabel}
          </dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>
            {EVENT.venue}
            <br />
            {EVENT.address}
          </dd>
        </div>
      </dl>

      <Button href="../" variant="ghost" size="lg">
        Back to homepage
      </Button>
    </section>
  );
}
