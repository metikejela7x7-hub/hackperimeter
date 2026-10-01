import { parseTeamEdit, planTeamEdit } from "@/components/Admin/teamEdits";
import { isApplicationId, listApplications, updateTeams } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";

/**
 * POST /api/admin/applications/:id/team: an organizer's team edit.
 * { action: "link", withId } | { action: "unlink" } | { action: "rename", teamName }
 * Returns every application the edit changed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const { id } = await params;
    if (!isApplicationId(id)) return jsonError(404, "Application not found.");

    const edit = parseTeamEdit(await request.json().catch(() => null));
    if (!edit) return jsonError(400, "Unknown team change.");

    const plan = planTeamEdit(await listApplications(), id, edit);
    if (!plan.ok) return jsonError(400, plan.message);

    return Response.json({ applications: await updateTeams(plan.updates) });
  } catch (error) {
    return serverError("admin-team-edit", error);
  }
}
