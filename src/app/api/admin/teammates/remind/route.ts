import { listApplications } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";
import { RemindersNotReady, remindListedTeammates } from "@/server/invites";

/**
 * POST /api/admin/teammates/remind: email every listed teammate who hasn't
 * applied (invite if never invited, otherwise one reminder, never more).
 */
export async function POST() {
  try {
    if (!(await getAdmin())) return unauthorized();
    return Response.json(await remindListedTeammates(await listApplications()));
  } catch (error) {
    if (error instanceof RemindersNotReady) return jsonError(409, error.message);
    return serverError("admin-remind-teammates", error);
  }
}
