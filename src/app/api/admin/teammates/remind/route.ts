import { listApplications } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";
import { RemindersNotReady, getReminderStatuses, remindListedTeammates } from "@/server/invites";

/** GET /api/admin/teammates/remind: invite/reminder status for each unapplied teammate. */
export async function GET() {
  try {
    if (!(await getAdmin())) return unauthorized();
    return Response.json({ statuses: await getReminderStatuses(await listApplications()) });
  } catch (error) {
    if (error instanceof RemindersNotReady) return jsonError(409, error.message);
    return serverError("admin-reminder-statuses", error);
  }
}

/**
 * POST /api/admin/teammates/remind { email?, again? }: email an unapplied
 * teammate (or all of them): invite if never invited, otherwise a reminder.
 * Someone already reminded is skipped unless the organizer sends `again`.
 */
export async function POST(request: Request) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      again?: unknown;
    } | null;
    const email = typeof body?.email === "string" ? body.email : undefined;
    return Response.json(
      await remindListedTeammates(await listApplications(), email, body?.again === true),
    );
  } catch (error) {
    if (error instanceof RemindersNotReady) return jsonError(409, error.message);
    return serverError("admin-remind-teammates", error);
  }
}
