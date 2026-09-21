import { EXPERIENCE_LEVELS, GRADUATION_YEARS, INTERESTS } from "@/data/apply";
import type {
  ApplicationData,
  FieldName,
  FormErrors,
  TeammateIndex,
} from "./types";

export const TEAMMATE_INDEXES: readonly TeammateIndex[] = [0, 1, 2];

export const teammateNameField = (index: TeammateIndex) =>
  `teammate${index}Name` as const;
export const teammateEmailField = (index: TeammateIndex) =>
  `teammate${index}Email` as const;

/** Fields on each step, in on-screen order (the first invalid one gets focus). */
export const FIELDS_BY_STEP: readonly (readonly FieldName[])[] = [
  ["fullName", "email", "school", "graduationYear"],
  ["major", "experience", "interests", "portfolioUrl"],
  [
    "teamMode",
    "teamName",
    ...TEAMMATE_INDEXES.flatMap((i) => [teammateNameField(i), teammateEmailField(i)]),
  ],
  ["needs", "agreed"],
];

export const TEAM_FIELDS = FIELDS_BY_STEP[2];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = {
  name: 100,
  short: 120,
  teamName: 60,
  url: 200,
  needs: 600,
} as const;

/** Accepts "github.com/me" as well as "https://github.com/me". Returns the full URL, or null. */
export function normalizeWebUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const { hostname } = new URL(withScheme);
    const tld = hostname.split(".").pop() ?? "";
    return hostname.includes(".") && tld.length >= 2 ? withScheme : null;
  } catch {
    return null;
  }
}

/** Validates the whole form. Callers pick out the fields they care about. */
export function validate(data: ApplicationData): FormErrors {
  const errors: FormErrors = {};

  // Step 1: About you
  const fullName = data.fullName.trim();
  if (!fullName) errors.fullName = "Enter your full name.";
  else if (fullName.length < 2) errors.fullName = "Full name needs at least 2 characters.";

  const email = data.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Enter a valid email address, like name@example.com.";

  if (!data.school.trim()) errors.school = "Enter your school.";

  if (!GRADUATION_YEARS.some((year) => year.value === data.graduationYear))
    errors.graduationYear = "Select your graduation year.";

  // Step 2: Builder profile
  if (!data.major.trim()) errors.major = "Enter your major, or “Undeclared”.";

  if (!EXPERIENCE_LEVELS.some((level) => level.value === data.experience))
    errors.experience = "Choose your experience level.";

  if (!data.interests.some((value) => INTERESTS.some((option) => option.value === value)))
    errors.interests = "Pick at least one interest.";

  if (data.portfolioUrl.trim() && !normalizeWebUrl(data.portfolioUrl))
    errors.portfolioUrl = "Enter a valid link, like github.com/yourname.";

  // Step 3: Team
  if (!data.teamMode) errors.teamMode = "Choose whether you're applying solo or with a team.";

  if (data.teamMode === "team") {
    const seen = new Set([email.toLowerCase()]);
    for (const index of TEAMMATE_INDEXES) {
      const name = data.teammates[index].name.trim();
      const mate = data.teammates[index].email.trim();
      if (!name && !mate) continue;

      if (!name) errors[teammateNameField(index)] = "Enter this teammate's name.";
      if (!mate) {
        errors[teammateEmailField(index)] = "Enter this teammate's email address.";
      } else if (!EMAIL_PATTERN.test(mate)) {
        errors[teammateEmailField(index)] = "Enter a valid email address.";
      } else if (seen.has(mate.toLowerCase())) {
        errors[teammateEmailField(index)] =
          mate.toLowerCase() === email.toLowerCase()
            ? "That's your own email. List your teammates here."
            : "This email is already listed for another teammate.";
      } else {
        seen.add(mate.toLowerCase());
      }
    }
  }

  // Step 4: Review and submit
  if (!data.agreed) errors.agreed = "Check this box to submit your application.";

  return errors;
}

/** Errors for the fields on one step only. */
export function validateStep(step: number, data: ApplicationData): FormErrors {
  const all = validate(data);
  const errors: FormErrors = {};
  for (const field of FIELDS_BY_STEP[step]) {
    const message = all[field];
    if (message) errors[field] = message;
  }
  return errors;
}

/** First field on a step that has an error, in on-screen order. */
export function firstInvalidField(step: number, errors: FormErrors): FieldName | undefined {
  return FIELDS_BY_STEP[step].find((field) => errors[field]);
}
