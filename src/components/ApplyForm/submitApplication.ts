import type { ApplicationData, ApplicationPayload } from "./types";
import { normalizeWebUrl } from "./validation";

/** Trims and tidies the form state into the shape the API will receive. */
export function buildPayload(data: ApplicationData): ApplicationPayload {
  const isTeam = data.teamMode === "team";
  const portfolioUrl = normalizeWebUrl(data.portfolioUrl);
  const teamName = data.teamName.trim();
  const needs = data.needs.trim();

  return {
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    school: data.school.trim(),
    graduationYear: data.graduationYear,
    major: data.major.trim(),
    experience: data.experience,
    interests: data.interests,
    ...(portfolioUrl ? { portfolioUrl } : {}),
    teamMode: isTeam ? "team" : "solo",
    ...(isTeam && teamName ? { teamName } : {}),
    teammates: isTeam
      ? data.teammates
          .map(({ name, email }) => ({ name: name.trim(), email: email.trim() }))
          .filter(({ name, email }) => name || email)
      : [],
    ...(needs ? { needs } : {}),
    agreed: true,
  };
}

/**
 * TODO(backend): Connect the real application-submission API here.
 *
 * This is a frontend-only MOCK: it waits briefly and resolves, and nothing is
 * stored or sent anywhere. To go live, replace the body with a request such as
 *
 *   const response = await fetch("/api/applications", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(payload),
 *   });
 *   if (!response.ok) throw new Error(`Submission failed (${response.status})`);
 *
 * Keep the contract: resolve on success, throw on failure. ApplyForm shows the
 * confirmation screen on resolve and a retryable error message on throw.
 * `payload` is already trimmed and validated client-side; re-validate on the server.
 */
export async function submitApplication(payload: ApplicationPayload): Promise<void> {
  void payload; // unused until the real API is connected
  await new Promise((resolve) => setTimeout(resolve, 900));
}
