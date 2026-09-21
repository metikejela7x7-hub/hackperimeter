/**
 * Options and copy for the /apply form.
 * Edit choices here; the form components only render them.
 */

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export const GRADUATION_YEARS: readonly ChoiceOption[] = [
  { value: "graduated", label: "Already graduated" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028" },
  { value: "2029", label: "2029" },
  { value: "2030", label: "2030" },
  { value: "2031+", label: "2031 or later" },
];

export const EXPERIENCE_LEVELS: readonly ChoiceOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to building. Still learning the basics.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Comfortable shipping small projects.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Build and ship regularly, on your own or with others.",
  },
];

export const INTERESTS: readonly ChoiceOption[] = [
  { value: "web", label: "Web development" },
  { value: "mobile", label: "Mobile apps" },
  { value: "ai", label: "AI & machine learning" },
  { value: "data", label: "Data & analytics" },
  { value: "security", label: "Cybersecurity" },
  { value: "games", label: "Game development" },
  { value: "hardware", label: "Hardware & IoT" },
  { value: "design", label: "Design & UX" },
  { value: "product", label: "Product & pitching" },
];

export const TEAM_MODES: readonly ChoiceOption[] = [
  {
    value: "solo",
    label: "Applying solo",
    description: "Just me.",
  },
  {
    value: "team",
    label: "Applying with a team",
    description: "I have a crew, or part of one.",
  },
];

/** Teammates you can list besides yourself (teams are 2–4 people). */
export const MAX_TEAMMATES = 3;

export const AGREEMENT_TEXT =
  "I confirm the information above is accurate and I agree to follow the HackPerimeter event rules.";

/** Look up the display label for a stored option value. */
export function labelFor(options: readonly ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
