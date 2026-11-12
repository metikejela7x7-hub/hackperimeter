import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";
import {
  ScheduleEmailNotReady,
  scheduleEmailStatus,
  sendScheduleBatch,
} from "@/server/scheduleEmail";

/** GET /api/admin/schedule-email: how many accepted applicants still need the schedule. */
export async function GET() {
  try {
    if (!(await getAdmin())) return unauthorized();
    return Response.json(await scheduleEmailStatus());
  } catch (error) {
    if (error instanceof ScheduleEmailNotReady) return jsonError(409, error.message);
    return serverError("admin-schedule-status", error);
  }
}

/** POST /api/admin/schedule-email: send the next batch of schedule emails. */
export async function POST() {
  try {
    if (!(await getAdmin())) return unauthorized();
    return Response.json(await sendScheduleBatch());
  } catch (error) {
    if (error instanceof ScheduleEmailNotReady) return jsonError(409, error.message);
    return serverError("admin-schedule-send", error);
  }
}
