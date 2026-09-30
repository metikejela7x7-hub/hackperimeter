import { listApplications } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { serverError, unauthorized } from "@/server/http";

/** GET /api/admin/applications: every application, newest first. */
export async function GET() {
  try {
    if (!(await getAdmin())) return unauthorized();
    return Response.json({ applications: await listApplications() });
  } catch (error) {
    return serverError("admin-applications", error);
  }
}
