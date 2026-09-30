import { listApplications } from "@/server/applications";
import { postToDiscord } from "@/server/discord";
import { isCronRequest, serverError, unauthorized } from "@/server/http";
import { computeStats, recapEmbed } from "@/server/stats";

/** GET /api/cron/daily-recap: Vercel Cron posts yesterday's numbers to Discord. */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();
  try {
    const stats = computeStats(await listApplications());
    const posted = await postToDiscord({ embeds: [recapEmbed(stats)] });
    return Response.json({ posted, total: stats.total, last24h: stats.last24h });
  } catch (error) {
    return serverError("cron-daily-recap", error);
  }
}
