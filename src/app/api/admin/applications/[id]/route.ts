import { after } from "next/server";
import { isApplicationStatus } from "@/data/apply";
import {
  claimAcceptanceEmail,
  deleteApplication,
  isApplicationId,
  releaseAcceptanceEmail,
  updateStatus,
} from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { acceptanceEmail, sendEmail } from "@/server/email";
import { jsonError, serverError, unauthorized } from "@/server/http";
import { deleteResume } from "@/server/resumes";

/**
 * PATCH /api/admin/applications/:id { status }: record a review decision.
 * The first time someone is accepted they get the acceptance email.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const { id } = await params;
    if (!isApplicationId(id)) return jsonError(404, "Application not found.");

    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    if (!isApplicationStatus(body?.status)) return jsonError(400, "Unknown status.");

    const update = await updateStatus(id, body.status);
    if (!update) return jsonError(404, "Application not found.");

    if (update.needsAcceptanceEmail) {
      after(async () => {
        if (!(await claimAcceptanceEmail(id))) return; // another request already sent it
        if (!(await sendEmail(acceptanceEmail(update.application)))) {
          await releaseAcceptanceEmail(id);
        }
      });
    }
    return Response.json({
      application: update.application,
      acceptanceEmailQueued: update.needsAcceptanceEmail,
    });
  } catch (error) {
    return serverError("admin-update-status", error);
  }
}

/** DELETE /api/admin/applications/:id: permanently remove an application and its resume. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return unauthorized();
    const { id } = await params;
    if (!isApplicationId(id)) return jsonError(404, "Application not found.");

    const resumePath = await deleteApplication(id);
    if (resumePath === undefined) return jsonError(404, "Application not found.");

    if (resumePath) {
      // The application is already gone; a leftover file is only a cleanup issue.
      await deleteResume(resumePath).catch((error) =>
        console.error("[admin-delete] could not remove resume", error),
      );
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError("admin-delete", error);
  }
}
