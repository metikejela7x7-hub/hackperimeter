import { isApplicationId, getResumePath } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";
import { resumeDownloadUrl } from "@/server/resumes";

/** GET /api/admin/applications/:id/resume: redirects to a one-minute download link. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const { id } = await params;
    if (!isApplicationId(id)) return jsonError(404, "Application not found.");

    const path = await getResumePath(id);
    if (!path) return jsonError(404, "This application has no resume.");

    return Response.redirect(await resumeDownloadUrl(path, `resume-${id.slice(0, 8)}.pdf`), 302);
  } catch (error) {
    return serverError("admin-resume", error);
  }
}
