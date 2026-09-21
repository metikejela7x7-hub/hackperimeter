import { GRADUATION_YEARS } from "@/data/apply";
import { FieldGrid, FieldStack, SelectField, TextField } from "./Fields";
import { LIMITS } from "./validation";
import type { StepProps } from "./types";

export function AboutStep({ data, errors, onChange, onBlur }: StepProps) {
  return (
    <FieldStack>
      <FieldGrid>
        <TextField
          name="fullName"
          label="Full name"
          autoComplete="name"
          maxLength={LIMITS.name}
          value={data.fullName}
          error={errors.fullName}
          onChange={(event) => onChange({ fullName: event.target.value }, ["fullName"])}
          onBlur={(event) => onBlur("fullName", event.target.value)}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.short}
          value={data.email}
          error={errors.email}
          onChange={(event) => onChange({ email: event.target.value }, ["email"])}
          onBlur={(event) => onBlur("email", event.target.value)}
        />
      </FieldGrid>
      <FieldGrid>
        <TextField
          name="school"
          label="School"
          autoComplete="organization"
          maxLength={LIMITS.short}
          value={data.school}
          error={errors.school}
          onChange={(event) => onChange({ school: event.target.value }, ["school"])}
          onBlur={(event) => onBlur("school", event.target.value)}
        />
        <SelectField
          name="graduationYear"
          label="Graduation year"
          placeholder="Select a year"
          options={GRADUATION_YEARS}
          value={data.graduationYear}
          error={errors.graduationYear}
          onChange={(event) =>
            onChange({ graduationYear: event.target.value }, ["graduationYear"])
          }
        />
      </FieldGrid>
    </FieldStack>
  );
}
