import { jsonError, serverError } from "@/server/http";
import { getInvite } from "@/server/invites";

/**
 * GET /api/invites/:id: the details an invite link pre-fills on the apply form.
 * The id is an unguessable secret that only the invitee was emailed.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invite = await getInvite((await params).id);
    if (!invite) return jsonError(404, "This invite link isn't valid any more.");
    return Response.json(invite, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError("invite", error);
  }
}
