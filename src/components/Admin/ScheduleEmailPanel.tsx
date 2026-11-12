"use client";

import { useEffect, useState } from "react";
import styles from "./Admin.module.css";

interface Status {
  accepted: number;
  remaining: number;
}

/**
 * Sends the schedule email (with the schedule PDF attached) to every accepted
 * applicant who hasn't had it. Works through them in small batches; if Resend's
 * daily limit stops it, clicking again later picks up where it left off.
 */
export function ScheduleEmailPanel({ acceptedCount }: { acceptedCount: number }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Refresh when acceptances change (acceptance emails carry the schedule too).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/schedule-email")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          (Status & { error?: string }) | null;
        if (cancelled) return;
        if (response.ok && body) setStatus(body);
        else if (body?.error) setMessage({ tone: "error", text: body.error });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [acceptedCount]);

  const send = async () => {
    const remaining = status?.remaining ?? 0;
    if (
      !window.confirm(
        `Email the schedule to ${remaining} accepted ${remaining === 1 ? "person" : "people"}? ` +
          "Each person only ever gets it once.",
      )
    ) {
      return;
    }
    setSending(true);
    setMessage(null);
    let total = 0;
    try {
      for (;;) {
        const response = await fetch("/api/admin/schedule-email", { method: "POST" });
        const body = (await response.json().catch(() => null)) as
          (Status & { sent: number; stopped: boolean; error?: string }) | null;
        if (!response.ok || !body) throw new Error(body?.error ?? "Couldn't send the schedule.");
        total += body.sent;
        setStatus({ accepted: body.accepted, remaining: body.remaining });
        setMessage({ tone: "ok", text: `Sending… ${total} sent, ${body.remaining} to go.` });
        if (body.stopped) {
          setMessage({
            tone: "error",
            text:
              `Sent ${total}, then Resend stopped accepting emails (often its daily limit). ` +
              `${body.remaining} still to go: click again later and it'll continue from there.`,
          });
          return;
        }
        if (body.remaining === 0 || body.sent === 0) break;
      }
      setMessage({
        tone: "ok",
        text: `Done: schedule sent to ${total} ${total === 1 ? "person" : "people"}.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: `${error instanceof Error ? error.message : "Couldn't send the schedule."}${
          total ? ` (${total} sent before it stopped.)` : ""
        }`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="schedule-title">
      <h2 id="schedule-title" className={styles.panelTitle}>
        Schedule email
      </h2>
      <p className={styles.muted}>
        Emails accepted applicants the day&rsquo;s schedule (PDF attached), with a link to the
        participant agreement, &ldquo;bring a friend&rdquo; and &ldquo;coming solo? join our
        Discord&rdquo;. People accepted from now on get the schedule in their acceptance email.
      </p>
      <div className={styles.downloads}>
        <button
          type="button"
          className={styles.download}
          disabled={sending || !status || status.remaining === 0}
          onClick={() => void send()}
        >
          {sending
            ? "Sending…"
            : status
              ? status.remaining === 0
                ? `Sent to all ${status.accepted} accepted`
                : `Send schedule (${status.remaining} to go)`
              : "Send schedule"}
        </button>
        <a
          className={styles.download}
          href="/hackperimeter-schedule.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          View schedule
        </a>
      </div>
      {message && (
        <p className={styles.message} role="status" data-tone={message.tone}>
          {message.text}
        </p>
      )}
    </section>
  );
}
