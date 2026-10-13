import { after } from "next/server";
import { parseTeamEdit, planTeamEdit } from "@/components/Admin/teamEdits";
import { groupTeams } from "@/components/Admin/teams";
import { isApplicationId, listApplications, updateTeams } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { jsonError, serverError, unauthorized } from "@/server/http";
import { notifyTeamMatched } from "@/server/notifications";

/**
 * POST /api/admin/applications/:id/team: an organizer's team edit.
 * { action: "link", withId, notify? } | { action: "unlink" } | { action: "rename", teamName }
 * Returns every application the edit changed. With notify, everyone on the
 * resulting team is emailed their teammates' names (after the response).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const { id } = await params;
    if (!isApplicationId(id)) return jsonError(404, "Application not found.");

    const edit = parseTeamEdit(await request.json().catch(() => null));
    if (!edit) return jsonError(400, "Unknown team change.");

    const applications = await listApplications();
    const plan = planTeamEdit(applications, id, edit);
    if (!plan.ok) return jsonError(400, plan.message);

    const changed = await updateTeams(plan.updates);
    let notified = 0;
    if (edit.action === "link" && edit.notify) {
      const latest = new Map(changed.map((a) => [a.id, a]));
      const team = groupTeams(applications.map((a) => latest.get(a.id) ?? a)).teams.find((t) =>
        t.members.some((m) => m.application.id === id),
      );
      if (team) {
        notified = team.members.length;
        after(() => notifyTeamMatched(team));
      }
    }
    return Response.json({ applications: changed, notified });
  } catch (error) {
    return serverError("admin-team-edit", error);
  }
}
