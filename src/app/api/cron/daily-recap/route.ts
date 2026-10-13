import { listApplications } from "@/server/applications";
import { postToDiscord } from "@/server/discord";
import { isCronRequest, serverError, unauthorized } from "@/server/http";
import { recapEmbed } from "@/server/recap";
import { sendWeeklyReminders } from "@/server/reminders";
import { computeStats } from "@/server/stats";

/**
 * GET /api/cron/daily-recap: Vercel Cron posts yesterday's numbers to Discord,
 * and on reminder days (weekly, before the event) emails accepted applicants.
 * The reminder lives here rather than in its own cron so it goes out at 9 AM
 * Eastern without needing another cron job.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();
  try {
    const stats = computeStats(await listApplications());
    const posted = await postToDiscord({ embeds: [recapEmbed(stats)] });
    const reminders = await sendWeeklyReminders().catch((error) => {
      console.error("[cron-daily-recap] weekly reminders failed", error);
      return 0;
    });
    return Response.json({ posted, total: stats.total, last24h: stats.last24h, reminders });
  } catch (error) {
    return serverError("cron-daily-recap", error);
  }
}
