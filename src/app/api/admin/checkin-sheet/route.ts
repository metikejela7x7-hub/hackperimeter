import { isApplicationStatus } from "@/data/apply";
import { listApplications } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { buildCheckinWorkbook } from "@/server/checkinSheet";
import { jsonError, serverError, unauthorized } from "@/server/http";

/**
 * GET /api/admin/checkin-sheet?status=accepted: the day-of check-in .xlsx.
 * Defaults to accepted applicants; pass status=all for everyone.
 */
export async function GET(request: Request) {
  try {
    if (!(await getAdmin())) return unauthorized();

    const status = new URL(request.url).searchParams.get("status") ?? "accepted";
    if (status !== "all" && !isApplicationStatus(status)) return jsonError(400, "Unknown status.");

    const applications = (await listApplications()).filter(
      (application) => status === "all" || application.status === status,
    );
    const file = await buildCheckinWorkbook(applications);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hackperimeter-checkin-${status}-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("admin-checkin-sheet", error);
  }
}
