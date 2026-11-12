import { scheduleEmail, sendEmail } from "./email";
import { optionalEnv } from "./env";
import { daysUntilEvent } from "./recap";
import { supabaseAdmin } from "./supabase";

/** Thrown when the schedule email can't run yet; the message says what to set up. */
export class ScheduleEmailNotReady extends Error {}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function notReady(error: { code?: string } | null) {
  if (error?.code === "42703" || error?.code === "PGRST204") {
    return new ScheduleEmailNotReady("Run migration 0005 (schedule email) in Supabase first.");
  }
  return null;
}

export interface ScheduleEmailStatus {
  /** Accepted applicants. */
  accepted: number;
  /** Accepted applicants still waiting for the schedule. */
  remaining: number;
}

export async function scheduleEmailStatus(): Promise<ScheduleEmailStatus> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select("schedule_sent_at")
    .eq("status", "accepted");
  const blocked = notReady(error);
  if (blocked) throw blocked;
  if (error) throw error;
  const rows = (data ?? []) as { schedule_sent_at: string | null }[];
  return { accepted: rows.length, remaining: rows.filter((r) => !r.schedule_sent_at).length };
}

export interface ScheduleBatchResult extends ScheduleEmailStatus {
  /** Sent in this batch. */
  sent: number;
  /** True when a send failed (often Resend's daily limit): stop and try again later. */
  stopped: boolean;
}

/**
 * Sends the schedule email to the next few accepted applicants who haven't had
 * it, marking each as sent. Small batches keep each request well inside
 * Vercel's time limit; the dashboard calls this repeatedly until none remain.
 * Stops at the first failed send, so hitting Resend's limit never skips anyone.
 */
export async function sendScheduleBatch(size = 15): Promise<ScheduleBatchResult> {
  if (!optionalEnv("EMAIL_FROM")) {
    throw new ScheduleEmailNotReady(
      "Set EMAIL_FROM in Vercel first, so emails come from your domain.",
    );
  }
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("applications")
    .select("id, full_name, email")
    .eq("status", "accepted")
    .is("schedule_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(size);
  const blocked = notReady(error);
  if (blocked) throw blocked;
  if (error) throw error;

  const daysLeft = daysUntilEvent();
  let sent = 0;
  let stopped = false;
  for (const row of (data ?? []) as { id: string; full_name: string; email: string }[]) {
    const ok = await sendEmail(
      scheduleEmail({ fullName: row.full_name, email: row.email }, daysLeft),
    );
    if (!ok) {
      stopped = true;
      break;
    }
    await markScheduleSent(row.id);
    sent += 1;
    await pause(600); // stay under Resend's rate limit (2 emails a second on the free plan)
  }
  return { ...(await scheduleEmailStatus()), sent, stopped };
}

/** Records that someone has the schedule (e.g. attached to their acceptance email). */
export async function markScheduleSent(id: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("applications")
    .update({ schedule_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error && !notReady(error)) throw error;
}
