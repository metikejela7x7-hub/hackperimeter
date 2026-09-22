"use client";

import { useState } from "react";
import { FAQ } from "@/data/event";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Faq.module.css";

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(FAQ[0].id);
  const list = useReveal<HTMLDivElement>();

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className={styles.inner}>
        <SectionHeading
          id="faq-title"
          index="05"
          eyebrow="Briefing notes"
          title="Questions"
        />

        <div ref={list.ref} className={`${styles.list} reveal-group`} data-visible={list.visible}>
          {FAQ.map((item, i) => {
            const open = openId === item.id;
            const buttonId = `faq-button-${item.id}`;
            const panelId = `faq-panel-${item.id}`;
            return (
              <div
                key={item.id}
                className={styles.item}
                data-open={open}
                style={{ "--i": i } as React.CSSProperties}
              >
                <h3 className={styles.heading}>
                  <button
                    type="button"
                    id={buttonId}
                    className={styles.trigger}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span>{item.question}</span>
                    <span className={styles.icon} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.panel}
                  inert={!open}
                >
                  <div className={styles.panelInner}>
                    <p className={styles.answer}>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
