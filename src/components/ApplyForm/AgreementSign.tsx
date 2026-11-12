"use client";

import { useEffect, useRef, useState } from "react";
import { AGREEMENT_URL } from "@/data/apply";
import {
  AGREEMENT_CONFIRMATIONS,
  AGREEMENT_SECTIONS,
  AGREEMENT_SUMMARY,
  AGREEMENT_VERSION,
} from "@/data/agreement";
import styles from "./Agreement.module.css";

/** The section 7 boxes, plus confirming the application itself is accurate. */
const CONFIRMATIONS = [
  ...AGREEMENT_CONFIRMATIONS,
  "I confirm the information in my application is accurate.",
];

interface AgreementSignProps {
  agreed: boolean;
  onChange: (agreed: boolean) => void;
  error?: string;
}

/**
 * Agreeing to the participant agreement: the full text opens in a dialog, its
 * confirmation boxes unlock only once it has been scrolled to the end, and the
 * person agrees by ticking every one and pressing "I agree".
 */
export function AgreementSign({ agreed, onChange, error }: AgreementSignProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(agreed);
  const [ticked, setTicked] = useState<boolean[]>(() => CONFIRMATIONS.map(() => agreed));
  const allTicked = ticked.every(Boolean);

  const checkEnd = () => {
    const body = bodyRef.current;
    if (body && body.scrollTop + body.clientHeight >= body.scrollHeight - 24) setReachedEnd(true);
  };

  const open = () => {
    dialogRef.current?.showModal();
    bodyRef.current?.scrollTo({ top: 0 });
    // A tall screen may show it all without scrolling.
    requestAnimationFrame(checkEnd);
  };

  const close = () => dialogRef.current?.close();

  // Closing with Escape counts as cancelling.
  useEffect(() => {
    const dialog = dialogRef.current;
    const onCancel = () => dialog?.close();
    dialog?.addEventListener("cancel", onCancel);
    return () => dialog?.removeEventListener("cancel", onCancel);
  }, []);

  const agree = () => {
    onChange(true);
    close();
  };

  return (
    <div className={styles.field}>
      <div className={styles.summary} data-signed={agreed} data-invalid={Boolean(error)}>
        {agreed ? (
          <p className={styles.signed}>
            <span aria-hidden="true">✓</span> You&rsquo;ve agreed to the Hackperimeter Participant
            Agreement.
          </p>
        ) : (
          <p>
            Before you submit, read and agree to the{" "}
            <strong>Hackperimeter Participant Agreement</strong>: the code of conduct, acceptable
            use, and rules of engagement for the event.
          </p>
        )}
        <button
          type="button"
          name="agreed"
          className={agreed ? styles.reopen : styles.openButton}
          aria-describedby={error ? "apply-agreed-error" : undefined}
          onClick={open}
        >
          {agreed ? "View agreement" : "Read & agree to the agreement"}
        </button>
      </div>
      {error && (
        <p id="apply-agreed-error" className={styles.error}>
          {error}
        </p>
      )}

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="agreement-title">
        <header className={styles.head}>
          <div>
            <h2 id="agreement-title" className={styles.title}>
              Hackperimeter participant agreement
            </h2>
            <p className={styles.meta}>
              Code of conduct, acceptable use, and rules of engagement · {AGREEMENT_VERSION}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            ✕
          </button>
        </header>

        <div ref={bodyRef} className={styles.body} onScroll={checkEnd} tabIndex={0}>
          <section className={styles.short}>
            <h3>The short version</h3>
            <ul>
              {AGREEMENT_SUMMARY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          {AGREEMENT_SECTIONS.map((section) => (
            <section key={section.title} className={styles.section}>
              <h3>{section.title}</h3>
              {section.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {section.lists?.map((list) => (
                <div key={list.heading}>
                  <h4>{list.heading}</h4>
                  <ul>
                    {list.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {section.after?.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}

          <section className={styles.section}>
            <h3>7. Your agreement</h3>
            <p>By registering for Hackperimeter, I confirm that:</p>
            {!reachedEnd && (
              <p className={styles.locked}>Scroll to the end of the agreement to tick these boxes.</p>
            )}
            <ul className={styles.confirmations}>
              {CONFIRMATIONS.map((text, index) => (
                <li key={text}>
                  <label className={styles.confirm} data-disabled={!reachedEnd}>
                    <input
                      type="checkbox"
                      checked={ticked[index]}
                      disabled={!reachedEnd}
                      onChange={(event) => {
                        const next = ticked.map((t, i) => (i === index ? event.target.checked : t));
                        setTicked(next);
                        if (!next.every(Boolean)) onChange(false);
                      }}
                    />
                    <span>{text}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className={styles.pdf}>
              <a href={AGREEMENT_URL} target="_blank" rel="noopener noreferrer">
                Download the agreement (PDF)
              </a>
            </p>
          </section>
        </div>

        <footer className={styles.foot}>
          <span className={styles.progress}>
            {ticked.filter(Boolean).length} of {CONFIRMATIONS.length} confirmed
          </span>
          <button type="button" className={styles.cancel} onClick={close}>
            Cancel
          </button>
          <button type="button" className={styles.signButton} disabled={!allTicked} onClick={agree}>
            I agree
          </button>
        </footer>
      </dialog>
    </div>
  );
}
