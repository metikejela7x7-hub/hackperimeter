import { isCronRequest, serverError, unauthorized } from "@/server/http";
import { pruneRateLimits } from "@/server/rateLimit";
import { cleanupOrphanedResumes } from "@/server/resumes";

/** GET /api/cron/maintenance: Vercel Cron removes orphaned resumes and old rate-limit rows. */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();
  try {
    const removedResumes = await cleanupOrphanedResumes();
    await pruneRateLimits();
    return Response.json({ removedResumes });
  } catch (error) {
    return serverError("cron-maintenance", error);
  }
}
