import { RESUME_MAX_BYTES, RESUME_MAX_LABEL } from "@/data/apply";
import { jsonError, serverError } from "@/server/http";
import { RATE_LIMITS, withinRateLimit } from "@/server/rateLimit";
import { checkResume, storeResume } from "@/server/resumes";

/**
 * POST /api/resume/upload: multipart form with a single "resume" PDF.
 * Returns { resumeId } for the application to reference. Uploads that no
 * application claims are removed by the daily maintenance job.
 */
export async function POST(request: Request) {
  try {
    const declared = Number(request.headers.get("content-length") ?? 0);
    // Multipart framing adds a little on top of the file itself.
    if (declared > RESUME_MAX_BYTES + 64 * 1024) {
      return jsonError(413, `Resumes must be ${RESUME_MAX_LABEL} or smaller.`);
    }
    if (!(await withinRateLimit(request, RATE_LIMITS.resumeUpload))) {
      return jsonError(429, "Too many uploads. Please wait a bit and try again.");
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("resume");
    if (!(file instanceof File)) return jsonError(400, 'Attach the PDF as a "resume" field.');

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkResume(bytes);
    if (!check.ok) return jsonError(400, check.message);

    const resumeId = await storeResume(bytes);
    return Response.json({ resumeId }, { status: 201 });
  } catch (error) {
    return serverError("resume-upload", error);
  }
}
