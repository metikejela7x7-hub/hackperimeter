import { EXPERIENCE_LEVELS, INTERESTS, RESUME_MAX_LABEL } from "@/data/apply";
import { ChipGroup, FieldStack, FileField, RadioGroup, TextField } from "./Fields";
import { LIMITS } from "./validation";
import type { StepProps } from "./types";

export function ProfileStep({ data, errors, onChange, onBlur }: StepProps) {
  return (
    <FieldStack>
      <TextField
        name="major"
        label="Major"
        hint="Undecided? Write “Undeclared”."
        autoComplete="off"
        maxLength={LIMITS.short}
        value={data.major}
        error={errors.major}
        onChange={(event) => onChange({ major: event.target.value }, ["major"])}
        onBlur={(event) => onBlur("major", event.target.value)}
      />
      <RadioGroup
        name="experience"
        legend="Experience level"
        options={EXPERIENCE_LEVELS}
        value={data.experience}
        error={errors.experience}
        onChange={(experience) => onChange({ experience }, ["experience"])}
      />
      <ChipGroup
        name="interests"
        legend="Interests"
        hint="Choose all that apply."
        options={INTERESTS}
        value={data.interests}
        error={errors.interests}
        onChange={(interests) => onChange({ interests }, ["interests"])}
      />
      <TextField
        name="portfolioUrl"
        label="GitHub or portfolio link"
        optional
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="github.com/yourname"
        maxLength={LIMITS.url}
        value={data.portfolioUrl}
        error={errors.portfolioUrl}
        onChange={(event) => onChange({ portfolioUrl: event.target.value }, ["portfolioUrl"])}
        onBlur={(event) => onBlur("portfolioUrl", event.target.value)}
      />
      <FileField
        name="resume"
        label="Resume"
        optional
        hint={`PDF, up to ${RESUME_MAX_LABEL}.`}
        accept="application/pdf,.pdf"
        value={data.resume}
        error={errors.resume}
        onChange={(resume) => onChange({ resume }, ["resume"])}
      />
    </FieldStack>
  );
}
