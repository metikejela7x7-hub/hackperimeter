import { MAX_TEAMMATES, TEAM_MODES } from "@/data/apply";
import { EVENT } from "@/data/event";
import { FieldGrid, FieldNote, FieldStack, RadioGroup, Subgroup, TextField } from "./Fields";
import { LIMITS, TEAM_FIELDS, TEAMMATE_INDEXES, teammateEmailField, teammateNameField } from "./validation";
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
            optional
            hint="Not decided yet? Leave it blank."
            autoComplete="off"
            maxLength={LIMITS.teamName}
            value={data.teamName}
            error={errors.teamName}
            onChange={(event) => onChange({ teamName: event.target.value }, [])}
          />

          <FieldStack>
            <FieldNote>
              Teams are {EVENT.teamSize} people including you. You can list up to{" "}
              {MAX_TEAMMATES} teammates.
            </FieldNote>
            {TEAMMATE_INDEXES.map((index) => {
              const nameField = teammateNameField(index);
              const emailField = teammateEmailField(index);
              const mate = data.teammates[index];
              return (
                <Subgroup key={index} legend={`Teammate ${index + 1} (optional)`}>
                  <FieldGrid>
                    <TextField
                      name={nameField}
                      label="Name"
                      optional
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
                      optional
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
