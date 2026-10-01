import { MAX_TEAMMATES, TEAM_MODES } from "@/data/apply";
import { EVENT } from "@/data/event";
import { FieldGrid, FieldNote, FieldStack, RadioGroup, Subgroup, TextField } from "./Fields";
import {
  EMAIL_PATTERN,
  LIMITS,
  TEAM_FIELDS,
  TEAMMATE_INDEXES,
  looksLikeSchoolEmail,
  teammateEmailField,
  teammateNameField,
} from "./validation";
import type { ApplicationData, StepProps } from "./types";

export function TeamStep({ data, errors, onChange, onBlur }: StepProps) {
  const updateTeammate = (index: number, key: "name" | "email", value: string) => {
    const teammates = data.teammates.map((mate, i) =>
      i === index ? { ...mate, [key]: value } : mate,
    );
    // Name and email errors depend on each other, so re-check the whole row.
    onChange({ teammates }, TEAM_FIELDS);
  };

  return (
    <FieldStack>
      <RadioGroup
        name="teamMode"
        legend="How are you applying?"
        options={TEAM_MODES}
        value={data.teamMode}
        error={errors.teamMode}
        onChange={(teamMode) =>
          onChange({ teamMode: teamMode as ApplicationData["teamMode"] }, TEAM_FIELDS)
        }
      />

      {data.teamMode === "team" && (
        <>
          <TextField
            name="teamName"
            label="Team name"
            hint="Ask your teammates to enter the same name so we can match you up."
            autoComplete="off"
            maxLength={LIMITS.teamName}
            value={data.teamName}
            error={errors.teamName}
            onChange={(event) => onChange({ teamName: event.target.value }, [])}
          />

          <FieldStack>
            <FieldNote>
              Teams are {EVENT.teamSize} people including you, and you can list up to{" "}
              {MAX_TEAMMATES} teammates. Each teammate applies separately, so enter the{" "}
              <strong>personal email they&rsquo;ll apply with</strong> so we can match your team.
              Not sure? Ask them.
            </FieldNote>
            {TEAMMATE_INDEXES.map((index) => {
              const nameField = teammateNameField(index);
              const emailField = teammateEmailField(index);
              const mate = data.teammates[index];
              const optional = index > 0;
              const email = mate.email.trim();
              const schoolEmail = EMAIL_PATTERN.test(email) && looksLikeSchoolEmail(email);
              return (
                <Subgroup
                  key={index}
                  legend={`Teammate ${index + 1}${optional ? " (optional)" : ""}`}
                >
                  <FieldGrid>
                    <TextField
                      name={nameField}
                      label="Name"
                      hint="As on their photo ID."
                      optional={optional}
                      showOptional={false}
                      autoComplete="off"
                      maxLength={LIMITS.name}
                      value={mate.name}
                      error={errors[nameField]}
                      onChange={(event) => updateTeammate(index, "name", event.target.value)}
                      onBlur={(event) => onBlur(nameField, event.target.value)}
                    />
                    <TextField
                      name={emailField}
                      label="Email"
                      hint="The email they'll apply with."
                      warning={
                        schoolEmail
                          ? "This looks like a school email. Make sure it's the one they'll apply with."
                          : undefined
                      }
                      optional={optional}
                      showOptional={false}
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      maxLength={LIMITS.short}
                      value={mate.email}
                      error={errors[emailField]}
                      onChange={(event) => updateTeammate(index, "email", event.target.value)}
                      onBlur={(event) => onBlur(emailField, event.target.value)}
                    />
                  </FieldGrid>
                </Subgroup>
              );
            })}
          </FieldStack>
        </>
      )}
    </FieldStack>
  );
}
