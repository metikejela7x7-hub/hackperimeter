import { MAX_TEAMMATES } from "@/data/apply";

export interface Teammate {
  name: string;
  email: string;
}

/** Raw form state, exactly as typed. Cleaned up by buildPayload() at submit time. */
export interface ApplicationData {
  // Step 1: About you
  fullName: string;
  email: string;
  school: string;
  graduationYear: string;
  // Step 2: Builder profile
  major: string;
  experience: string;
  interests: string[];
  portfolioUrl: string;
  /** Optional PDF, uploaded separately just before the application is sent. */
  resume: File | null;
  // Step 3: Team
  teamMode: "" | "solo" | "team";
  teamName: string;
  teammates: Teammate[];
  // Step 4: Review and submit
  needs: string;
  agreed: boolean;
}

export const EMPTY_APPLICATION: ApplicationData = {
  fullName: "",
  email: "",
  school: "",
  graduationYear: "",
  major: "",
  experience: "",
  interests: [],
  portfolioUrl: "",
  resume: null,
  teamMode: "",
  teamName: "",
  teammates: Array.from({ length: MAX_TEAMMATES }, () => ({ name: "", email: "" })),
  needs: "",
  agreed: false,
};

/** Cleaned data sent to the (future) API. Optional values are omitted when empty. */
export interface ApplicationPayload {
  fullName: string;
  email: string;
  school: string;
  graduationYear: string;
  major: string;
  experience: string;
  interests: string[];
  portfolioUrl?: string;
  teamMode: "solo" | "team";
  teamName?: string;
  teammates: Teammate[];
  needs?: string;
  agreed: true;
}

/** What POST /api/applications receives: the payload plus the uploaded resume's id. */
export interface ApplicationRequest extends ApplicationPayload {
  resumeId?: string;
}

export type TeammateIndex = 0 | 1 | 2;

/** Every validated control. Also the control's `name` attribute, used to focus it. */
export type FieldName =
  | "fullName"
  | "email"
  | "school"
  | "graduationYear"
  | "major"
  | "experience"
  | "interests"
  | "portfolioUrl"
  | "resume"
  | "teamMode"
  | "teamName"
  | `teammate${TeammateIndex}Name`
  | `teammate${TeammateIndex}Email`
  | "needs"
  | "agreed";

export type FormErrors = Partial<Record<FieldName, string>>;

/** Props shared by the three input steps. */
export interface StepProps {
  data: ApplicationData;
  errors: FormErrors;
  /**
   * Apply a change. `recheck` lists fields whose already-visible error should be
   * re-validated live, so messages clear as soon as the answer is fixed.
   */
  onChange: (patch: Partial<ApplicationData>, recheck: readonly FieldName[]) => void;
  /** Called with the field's current text when it loses focus. */
  onBlur: (field: FieldName, value: string) => void;
}
