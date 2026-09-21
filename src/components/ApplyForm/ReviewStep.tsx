import type { ReactNode } from "react";
import {
  AGREEMENT_TEXT,
  EXPERIENCE_LEVELS,
  GRADUATION_YEARS,
  INTERESTS,
  labelFor,
} from "@/data/apply";
import { CheckboxField, FieldStack, TextAreaField } from "./Fields";
import { LIMITS } from "./validation";
import type { ApplicationData, StepProps } from "./types";
import styles from "./Review.module.css";

interface ReviewStepProps extends Omit<StepProps, "onBlur"> {
  /** Jump back to a step to change an answer. */
  onEdit: (step: number) => void;
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className={styles.term}>{term}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

function Block({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{title}</h3>
        <button type="button" className={styles.edit} onClick={() => onEdit(step)}>
          Edit<span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl className={styles.list}>{children}</dl>
    </div>
  );
}

/** Shown for optional answers left blank. */
function Empty() {
  return (
    <span className={styles.empty}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not provided</span>
    </span>
  );
}

function teamSummary(data: ApplicationData) {
  const teammates = data.teammates.filter(({ name, email }) => name.trim() || email.trim());
  return { teammates, teamName: data.teamName.trim() };
}

export function ReviewStep({ data, errors, onChange, onEdit }: ReviewStepProps) {
  const { teammates, teamName } = teamSummary(data);
  const isTeam = data.teamMode === "team";

  return (
    <FieldStack>
      <div className={styles.summary}>
        <Block title="About you" step={0} onEdit={onEdit}>
          <Row term="Full name">{data.fullName.trim()}</Row>
          <Row term="Email">{data.email.trim()}</Row>
          <Row term="School">{data.school.trim()}</Row>
          <Row term="Graduation year">{labelFor(GRADUATION_YEARS, data.graduationYear)}</Row>
        </Block>

        <Block title="Builder profile" step={1} onEdit={onEdit}>
          <Row term="Major">{data.major.trim()}</Row>
          <Row term="Experience">{labelFor(EXPERIENCE_LEVELS, data.experience)}</Row>
          <Row term="Interests">
            {data.interests.map((value) => labelFor(INTERESTS, value)).join(", ")}
          </Row>
          <Row term="Link">{data.portfolioUrl.trim() || <Empty />}</Row>
        </Block>

        <Block title="Team" step={2} onEdit={onEdit}>
          <Row term="Applying">{isTeam ? "With a team" : "Solo"}</Row>
          {isTeam && (
            <>
              <Row term="Team name">{teamName || <Empty />}</Row>
              <Row term="Teammates">
                {teammates.length > 0 ? (
                  <ul className={styles.mates}>
                    {teammates.map((mate, index) => (
                      <li key={index}>
                        {[mate.name.trim(), mate.email.trim()].filter(Boolean).join(" · ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty />
                )}
              </Row>
            </>
          )}
        </Block>
      </div>

      <TextAreaField
        name="needs"
        label="Dietary or accessibility needs"
        optional
        hint="Anything we should plan for? Allergies, mobility, sensory needs, or anything else."
        maxLength={LIMITS.needs}
        value={data.needs}
        error={errors.needs}
        onChange={(event) => onChange({ needs: event.target.value }, [])}
      />

      <CheckboxField
        name="agreed"
        checked={data.agreed}
        error={errors.agreed}
        onChange={(agreed) => onChange({ agreed }, ["agreed"])}
      >
        {AGREEMENT_TEXT}
      </CheckboxField>
    </FieldStack>
  );
}
