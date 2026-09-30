import type {
  ApplicationData,
  ApplicationPayload,
  ApplicationRequest,
  FormErrors,
} from "./types";
import { normalizeWebUrl } from "./validation";

/** Trims and tidies the form state into the shape the API receives. The server runs it too. */
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

/** A failure with a message that is safe and useful to show the applicant. */
export class SubmitError extends Error {
  constructor(
    message: string,
    /** Per-field messages from the server, keyed like the form's own errors. */
    readonly fields?: FormErrors,
  ) {
    super(message);
    this.name = "SubmitError";
  }
}

const NETWORK_MESSAGE =
  "We couldn't send your application. Check your connection and try again.";

async function readError(response: Response): Promise<SubmitError> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string; fields?: FormErrors }
    | null;
  return new SubmitError(body?.error ?? NETWORK_MESSAGE, body?.fields);
}

async function post(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { method: "POST", ...init });
  } catch {
    throw new SubmitError(NETWORK_MESSAGE);
  }
}

/** Uploads the resume PDF and returns the id the application refers to it by. */
async function uploadResume(file: File): Promise<string> {
  const form = new FormData();
  form.append("resume", file);
  const response = await post("/api/resume/upload", { body: form });
  if (!response.ok) {
    const error = await readError(response);
    throw new SubmitError(error.message, { resume: error.message, ...error.fields });
  }
  const { resumeId } = (await response.json()) as { resumeId: string };
  return resumeId;
}

/**
 * Sends the application: the resume first (if any), then the answers.
 * Resolves on success; throws SubmitError with a message to show on failure.
 */
export async function submitApplication(
  payload: ApplicationPayload,
  resume: File | null,
): Promise<void> {
  const request: ApplicationRequest = resume
    ? { ...payload, resumeId: await uploadResume(resume) }
    : payload;

  const response = await post("/api/applications", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await readError(response);
}
