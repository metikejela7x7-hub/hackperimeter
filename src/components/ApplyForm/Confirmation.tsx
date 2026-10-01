"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT } from "@/data/event";
import { Button } from "@/components/Button/Button";
import styles from "./Confirmation.module.css";

interface ConfirmationProps {
  name: string;
  email: string;
  /** Team applicants get a reminder to send teammates the form. */
  isTeam: boolean;
}

/** Tells team applicants their teammates must apply too, with a link to share. */
function ShareWithTeammates() {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${window.location.pathname}`;
  const linkRef = useRef<HTMLElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard blocked: select the link so it can be copied by hand.
      const range = document.createRange();
      if (linkRef.current) range.selectNodeContents(linkRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  };

  return (
    <div className={styles.next}>
      <p className={styles.nextTitle}>Next: tell your teammates</p>
      <p>
        Each teammate needs to apply separately, using the email you listed for them. Send them
        this link:
      </p>
      <div className={styles.share}>
        <code ref={linkRef} className={styles.link}>
          {link}
        </code>
        <button type="button" className={styles.copy} onClick={() => void copy()}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="sr-only" role="status">
        {copied ? "Link copied" : ""}
      </p>
    </div>
  );
}

export function Confirmation({ name, email, isTeam }: ConfirmationProps) {
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

      {isTeam && <ShareWithTeammates />}

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
