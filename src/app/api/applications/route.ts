import { after } from "next/server";
import { createApplication, parseApplication } from "@/server/applications";
import { jsonError, serverError } from "@/server/http";
import { notifyNewApplication } from "@/server/notifications";
import { RATE_LIMITS, withinRateLimit } from "@/server/rateLimit";

/** POST /api/applications: submit an application (JSON, see ApplicationRequest). */
export async function POST(request: Request) {
  try {
    if (!(await withinRateLimit(request, RATE_LIMITS.apply))) {
      return jsonError(429, "Too many attempts. Please wait a bit and try again.");
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = parseApplication(body);
    if (!parsed.ok) return jsonError(400, parsed.message, { fields: parsed.fields });

    const result = await createApplication(parsed.application);
    switch (result.kind) {
      case "duplicate":
        return jsonError(409, "An application with this email already exists. You're already on our list!");
      case "unknown-resume":
        return jsonError(400, "Your resume upload expired. Please attach it again.", {
          fields: { resume: "Please attach your resume again." },
        });
      case "created":
        // Email + Discord run after the response, so applicants never wait on them.
        after(() => notifyNewApplication(result.application));
        return Response.json({ id: result.application.id }, { status: 201 });
    }
  } catch (error) {
    return serverError("applications", error);
  }
}
