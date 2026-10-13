import { EVENT } from "@/data/event";
import { listApplications } from "./applications";
import { sendEmails, weeklyReminderEmail } from "./email";
import { supabaseAdmin } from "./supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole weeks left when today is the event's weekday (a Friday for a Friday
 * event), counted in Eastern Time; otherwise null. Reminders go out 4, 3, 2
 * and 1 weeks before, plus any earlier weeks while applications are open.
 */
export function reminderWeeksLeft(now = new Date()): number | null {
  const eastern = (time: number) =>
    new Date(new Date(time).toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today = eastern(now.getTime());
  const eventDay = eastern(EVENT.startsAt);
  const midnight = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((midnight(eventDay) - midnight(today)) / DAY_MS);
  if (days < 7 || days % 7 !== 0) return null;
  return days / 7;
}

/**
 * Sends this week's reminder to every accepted applicant, once. Called by the
 * daily cron; does nothing on other days. Returns how many emails went out.
 */
export async function sendWeeklyReminders(now = new Date()): Promise<number> {
  const weeksLeft = reminderWeeksLeft(now);
  if (weeksLeft === null) return 0;

  const db = supabaseAdmin();
  // Claim this week first, so a retried job can't send it twice.
  const { data: claimed, error } = await db
    .from("weekly_reminders")
    .upsert({ weeks_left: weeksLeft }, { onConflict: "weeks_left", ignoreDuplicates: true })
    .select("weeks_left");
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    console.warn("[reminders] weekly_reminders table missing; run migration 0003. Skipping.");
    return 0;
  }
  if (error) throw error;
  if (!claimed || claimed.length === 0) return 0; // already sent this week

  const accepted = (await listApplications()).filter((a) => a.status === "accepted");
  const sent = await sendEmails(accepted.map((a) => weeklyReminderEmail(a, weeksLeft)));
  await db.from("weekly_reminders").update({ recipients: sent }).eq("weeks_left", weeksLeft);
  return sent;
}
