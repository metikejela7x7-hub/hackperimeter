import { buildPayload } from "@/components/ApplyForm/submitApplication";
import type {
  ApplicationData,
  ApplicationRequest,
  FormErrors,
  Teammate,
} from "@/components/ApplyForm/types";
import { LIMITS, validate } from "@/components/ApplyForm/validation";
import {
  INTERESTS,
  MAX_TEAMMATES,
  type ApplicationStatus,
} from "@/data/apply";
import { selectAll, supabaseAdmin } from "./supabase";

/** An application as the admin dashboard and notifications see it. */
export interface ApplicationRecord {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  school: string;
  graduationYear: string;
  major: string;
  experience: string;
  interests: string[];
  portfolioUrl: string | null;
  teamMode: "solo" | "team";
  teamName: string | null;
  teammates: Teammate[];
  needs: string | null;
  hasResume: boolean;
  status: ApplicationStatus;
}

interface ApplicationRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  school: string;
  graduation_year: string;
  major: string;
  experience: string;
  interests: string[];
  portfolio_url: string | null;
  team_mode: "solo" | "team";
  team_name: string | null;
  teammates: Teammate[];
  needs: string | null;
  resume_path: string | null;
  status: ApplicationStatus;
  accepted_email_sent_at: string | null;
}

const COLUMNS =
  "id, created_at, full_name, email, school, graduation_year, major, experience, interests, portfolio_url, team_mode, team_name, teammates, needs, resume_path, status, accepted_email_sent_at";

function toRecord(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    email: row.email,
    school: row.school,
    graduationYear: row.graduation_year,
    major: row.major,
    experience: row.experience,
    interests: row.interests,
    portfolioUrl: row.portfolio_url,
    teamMode: row.team_mode,
    teamName: row.team_name,
    teammates: row.teammates,
    needs: row.needs,
    hasResume: row.resume_path !== null,
    status: row.status,
  };
}

// ---------------------------------------------------------------------------
// Parsing: never trust the browser. Re-run the form's own validation, plus the
// type and length checks the browser enforces with maxLength.
// ---------------------------------------------------------------------------

export type ParseResult =
  | { ok: true; application: ApplicationRequest }
  | { ok: false; message: string; fields?: FormErrors };

const MAX_EMAIL_LENGTH = 254;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalid = (message: string, fields?: FormErrors): ParseResult => ({
  ok: false,
  message,
  fields,
});

/** A string field; missing or null reads as "". Returns undefined for any other type. */
function text(value: unknown): string | undefined {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : undefined;
}

export function parseApplication(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalid("Send the application as a JSON object.");
  }
  const input = body as Record<string, unknown>;

  const strings = {
    fullName: text(input.fullName),
    email: text(input.email),
    school: text(input.school),
    graduationYear: text(input.graduationYear),
    major: text(input.major),
    experience: text(input.experience),
    portfolioUrl: text(input.portfolioUrl),
    teamName: text(input.teamName),
    needs: text(input.needs),
  };
  for (const [key, value] of Object.entries(strings)) {
    if (value === undefined) return invalid(`"${key}" must be text.`);
  }
  const s = strings as Record<keyof typeof strings, string>;

  const teamMode = input.teamMode;
  if (teamMode !== "solo" && teamMode !== "team") {
    return invalid(`"teamMode" must be "solo" or "team".`);
  }

  const interests = input.interests;
  if (
    !Array.isArray(interests) ||
    !interests.every((value) => INTERESTS.some((option) => option.value === value))
  ) {
    return invalid(`"interests" must be a list of known interests.`);
  }

  const rawTeammates = input.teammates ?? [];
  if (!Array.isArray(rawTeammates) || rawTeammates.length > MAX_TEAMMATES) {
    return invalid(`"teammates" must be a list of at most ${MAX_TEAMMATES} people.`);
  }
  const teammates: Teammate[] = [];
  for (const mate of rawTeammates) {
    const name = text((mate as Record<string, unknown> | null)?.name);
    const email = text((mate as Record<string, unknown> | null)?.email);
    if (!mate || typeof mate !== "object" || name === undefined || email === undefined) {
      return invalid(`Each teammate needs a text "name" and "email".`);
    }
    teammates.push({ name, email });
  }
  while (teammates.length < MAX_TEAMMATES) teammates.push({ name: "", email: "" });

  if (input.agreed !== true) {
    return invalid("The application must be agreed to.", {
      agreed: "Check this box to submit your application.",
    });
  }

  const resumeId = input.resumeId;
  if (resumeId !== undefined && (typeof resumeId !== "string" || !UUID_PATTERN.test(resumeId))) {
    return invalid(`"resumeId" must be the id returned by the resume upload.`);
  }

  const data: ApplicationData = {
    ...s,
    interests: [...new Set(interests as string[])],
    teamMode,
    teammates,
    resume: null,
    agreed: true,
  };

  const errors: FormErrors = validate(data);
  const tooLong = (value: string, max: number) => value.trim().length > max;
  if (tooLong(s.fullName, LIMITS.name)) errors.fullName = `Keep this under ${LIMITS.name} characters.`;
  if (tooLong(s.email, MAX_EMAIL_LENGTH)) errors.email = "That email address is too long.";
  if (tooLong(s.school, LIMITS.short)) errors.school = `Keep this under ${LIMITS.short} characters.`;
  if (tooLong(s.major, LIMITS.short)) errors.major = `Keep this under ${LIMITS.short} characters.`;
  if (tooLong(s.portfolioUrl, LIMITS.url)) errors.portfolioUrl = "That link is too long.";
  if (tooLong(s.teamName, LIMITS.teamName)) errors.teamName = "That team name is too long.";
  if (tooLong(s.needs, LIMITS.needs)) errors.needs = `Keep this under ${LIMITS.needs} characters.`;
  teammates.forEach((mate, index) => {
    if (tooLong(mate.name, LIMITS.name)) errors[`teammate${index as 0 | 1 | 2}Name`] = "That name is too long.";
    if (tooLong(mate.email, MAX_EMAIL_LENGTH))
      errors[`teammate${index as 0 | 1 | 2}Email`] = "That email address is too long.";
  });

  if (Object.keys(errors).length > 0) {
    return invalid("Some answers need fixing.", errors);
  }

  return {
    ok: true,
    application: { ...buildPayload(data), ...(resumeId ? { resumeId } : {}) },
  };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export type CreateResult =
  | { kind: "created"; application: ApplicationRecord }
  | { kind: "duplicate" }
  | { kind: "unknown-resume" };

export async function createApplication(request: ApplicationRequest): Promise<CreateResult> {
  const db = supabaseAdmin();

  let resumePath: string | null = null;
  if (request.resumeId) {
    const { data, error } = await db
      .from("resume_uploads")
      .select("path")
      .eq("id", request.resumeId)
      .is("claimed_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { kind: "unknown-resume" };
    resumePath = data.path;
  }

  const { data, error } = await db
    .from("applications")
    .insert({
      full_name: request.fullName,
      email: request.email,
      school: request.school,
      graduation_year: request.graduationYear,
      major: request.major,
      experience: request.experience,
      interests: request.interests,
      portfolio_url: request.portfolioUrl ?? null,
      team_mode: request.teamMode,
      team_name: request.teamName ?? null,
      teammates: request.teammates,
      needs: request.needs ?? null,
      resume_path: resumePath,
    })
    .select(COLUMNS)
    .single<ApplicationRow>();

  if (error) {
    // 23505: unique_violation on lower(email), i.e. this person already applied.
    if (error.code === "23505") return { kind: "duplicate" };
    throw error;
  }

  if (request.resumeId) {
    const { error: claimError } = await db
      .from("resume_uploads")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", request.resumeId);
    // Not fatal: resume cleanup also skips any file an application points at.
    if (claimError) console.error("[applications] could not mark resume claimed", claimError);
  }

  return { kind: "created", application: toRecord(data) };
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const rows = await selectAll<ApplicationRow>((from, to) =>
    supabaseAdmin()
      .from("applications")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  return rows.map(toRecord);
}

export async function countApplications(): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("applications")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** The storage path of an application's resume, or null when it has none. */
export async function getResumePath(id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select("resume_path")
    .eq("id", id)
    .maybeSingle<{ resume_path: string | null }>();
  if (error) throw error;
  return data?.resume_path ?? null;
}

export interface StatusUpdate {
  application: ApplicationRecord;
  /** True when this change should trigger the one-time acceptance email. */
  needsAcceptanceEmail: boolean;
}

export async function updateStatus(id: string, status: ApplicationStatus): Promise<StatusUpdate | null> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle<ApplicationRow>();
  if (error) throw error;
  if (!data) return null;
  return {
    application: toRecord(data),
    needsAcceptanceEmail: status === "accepted" && data.accepted_email_sent_at === null,
  };
}

/**
 * Atomically claims the one-time acceptance email. Returns true for exactly
 * one caller, even if two admins accept the same person at once.
 */
export async function claimAcceptanceEmail(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .update({ accepted_email_sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "accepted")
    .is("accepted_email_sent_at", null)
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Undoes a claim when sending failed, so the next acceptance tries again. */
export async function releaseAcceptanceEmail(id: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("applications")
    .update({ accepted_email_sent_at: null })
    .eq("id", id);
  if (error) throw error;
}

export function isApplicationId(value: string): boolean {
  return UUID_PATTERN.test(value);
}
