"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormButton } from "@/components/FormButton/FormButton";
import { AboutStep } from "./AboutStep";
import { Confirmation } from "./Confirmation";
import { ProfileStep } from "./ProfileStep";
import { ReviewStep } from "./ReviewStep";
import { Stepper } from "./Stepper";
import { TeamStep } from "./TeamStep";
import { buildPayload, submitApplication } from "./submitApplication";
import { EMPTY_APPLICATION } from "./types";
import type { ApplicationData, FieldName, FormErrors, StepProps } from "./types";
import { FIELDS_BY_STEP, firstInvalidField, validate, validateStep } from "./validation";
import styles from "./ApplyForm.module.css";

const STEPS = [
  { id: "about", label: "About you", blurb: "Who's applying?" },
  { id: "profile", label: "Builder profile", blurb: "What you build and what you're into." },
  { id: "team", label: "Team", blurb: "Tell us who's on your crew." },
  { id: "review", label: "Review and submit", blurb: "Check your answers, then send them in." },
] as const;

const LAST_STEP = STEPS.length - 1;

type Status = "editing" | "submitting" | "submitted";

function withoutFields(errors: FormErrors, fields: readonly FieldName[]): FormErrors {
  const next = { ...errors };
  for (const field of fields) delete next[field];
  return next;
}

export function ApplyForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ApplicationData>(EMPTY_APPLICATION);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("editing");
  const [submitError, setSubmitError] = useState("");
  /** True after "Edit" on the review step: Continue then returns straight to review. */
  const [returnToReview, setReturnToReview] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeadingOnStepChange = useRef(false);

  // After a step change, move focus to the new step's heading (not on first load).
  useEffect(() => {
    if (!focusHeadingOnStepChange.current) return;
    focusHeadingOnStepChange.current = false;
    headingRef.current?.focus();
  }, [step]);

  const goTo = (index: number, fromReview = false) => {
    focusHeadingOnStepChange.current = true;
    setReturnToReview(fromReview);
    setStep(index);
  };

  /** Every control's `name` is its field name, so any field can be focused by name. */
  const focusField = (field: FieldName) => {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  };

  const handleChange: StepProps["onChange"] = (patch, recheck) => {
    const next = { ...data, ...patch };
    setData(next);
    if (recheck.length === 0) return;

    // Only touch errors that are already showing: they update or clear as the
    // answer changes, but no new errors appear while someone is still typing.
    const fresh = validate(next);
    setErrors((current) => {
      const updated = { ...current };
      for (const field of recheck) {
        if (!current[field]) continue;
        const message = fresh[field];
        if (message) updated[field] = message;
        else delete updated[field];
      }
      return updated;
    });
  };

  // Blur only flags text that was actually entered and is wrong. Empty-field
  // errors wait for Continue, so an error can't appear (and shift the layout)
  // between pressing and releasing a button.
  const handleBlur: StepProps["onBlur"] = (field, value) => {
    if (!value.trim()) return;
    const message = validate(data)[field];
    setErrors((current) => {
      if (message) return { ...current, [field]: message };
      return current[field] ? withoutFields(current, [field]) : current;
    });
  };

  const continueFromStep = () => {
    const stepErrors = validateStep(step, data);
    const first = firstInvalidField(step, stepErrors);
    if (first) {
      setErrors((current) => ({ ...withoutFields(current, FIELDS_BY_STEP[step]), ...stepErrors }));
      focusField(first);
      return;
    }
    setErrors((current) => withoutFields(current, FIELDS_BY_STEP[step]));
    goTo(returnToReview ? LAST_STEP : step + 1);
  };

  const submit = async () => {
    const all = validate(data);
    const invalidStep = FIELDS_BY_STEP.findIndex((fields) => fields.some((field) => all[field]));
    if (invalidStep !== -1) {
      setErrors(all);
      if (invalidStep === LAST_STEP) focusField(firstInvalidField(LAST_STEP, all)!);
      else goTo(invalidStep, true);
      return;
    }

    setSubmitError("");
    setStatus("submitting");
    try {
      await submitApplication(buildPayload(data));
      setStatus("submitted");
    } catch {
      setStatus("editing");
      setSubmitError(
        "We couldn't send your application. Check your connection and try again.",
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    if (step < LAST_STEP) continueFromStep();
    else void submit();
  };

  if (status === "submitted") {
    return <Confirmation name={data.fullName} email={data.email} />;
  }

  const current = STEPS[step];
  const submitting = status === "submitting";
  const stepProps: StepProps = { data, errors, onChange: handleChange, onBlur: handleBlur };

  return (
    <div className={styles.card}>
      <Stepper
        steps={STEPS}
        current={step}
        onSelect={(index) => goTo(index, step === LAST_STEP)}
      />

      <form
        ref={formRef}
        className={styles.form}
        aria-label="HackPerimeter application"
        noValidate
        onSubmit={handleSubmit}
      >
        <header className={styles.stepHead}>
          <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            <span className={styles.stepCount}>
              Step {step + 1} of {STEPS.length}
              <span className="sr-only">: </span>
            </span>
            {current.label}
          </h2>
          <p className={styles.stepBlurb}>
            {current.blurb}
            {step < LAST_STEP && " All fields are required unless marked optional."}
          </p>
        </header>

        {step === 0 && <AboutStep {...stepProps} />}
        {step === 1 && <ProfileStep {...stepProps} />}
        {step === 2 && <TeamStep {...stepProps} />}
        {step === 3 && <ReviewStep {...stepProps} onEdit={(index) => goTo(index, true)} />}

        {submitError && (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}

        <div className={styles.actions}>
          {step > 0 && (
            <FormButton
              key="back"
              variant="ghost"
              size="lg"
              onClick={() => goTo(step - 1, false)}
              disabled={submitting}
            >
              Back
            </FormButton>
          )}
          <FormButton
            key={`primary-${step}`}
            type="submit"
            size="lg"
            arrow={!submitting}
            disabled={submitting}
          >
            {step < LAST_STEP
              ? returnToReview
                ? "Back to review"
                : "Continue"
              : submitting
                ? "Submitting…"
                : "Submit application"}
          </FormButton>
        </div>

        <p className="sr-only" role="status">
          {submitting ? "Submitting your application…" : ""}
        </p>
      </form>
    </div>
  );
}
