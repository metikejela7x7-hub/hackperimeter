import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import type { ChoiceOption } from "@/data/apply";
import type { FieldName } from "./types";
import styles from "./Fields.module.css";

/* Every control's id is derived from its field name, so labels, hints and
   errors can be wired together without passing ids around. */
const fieldId = (name: FieldName) => `apply-${name}`;
const hintId = (name: FieldName) => `${fieldId(name)}-hint`;
const errorId = (name: FieldName) => `${fieldId(name)}-error`;

function describedBy(name: FieldName, hint?: string, error?: string) {
  const ids = [hint && hintId(name), error && errorId(name)].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldError({ name, message }: { name: FieldName; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(name)} className={styles.error}>
      <svg
        className={styles.errorIcon}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5v4.2M8 10.6v1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

function Hint({ name, text }: { name: FieldName; text?: string }) {
  return text ? (
    <p id={hintId(name)} className={styles.hint}>
      {text}
    </p>
  ) : null;
}

function OptionalTag() {
  return <span className={styles.optional}> (optional)</span>;
}

interface BaseFieldProps {
  name: FieldName;
  label: string;
  optional?: boolean;
  /** Set false to drop the "(optional)" tag when the surrounding group already says it. */
  showOptional?: boolean;
  hint?: string;
  error?: string;
}

type ControlProps<T> = Omit<
  T,
  "id" | "name" | "className" | "required" | "aria-invalid" | "aria-describedby"
>;

export function TextField({
  name,
  label,
  optional,
  showOptional = true,
  hint,
  error,
  ...rest
}: BaseFieldProps & ControlProps<InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId(name)}>
        {label}
        {optional && showOptional && <OptionalTag />}
      </label>
      <Hint name={name} text={hint} />
      <input
        {...rest}
        id={fieldId(name)}
        name={name}
        className={styles.control}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      />
      <FieldError name={name} message={error} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  optional,
  showOptional = true,
  hint,
  error,
  ...rest
}: BaseFieldProps & ControlProps<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId(name)}>
        {label}
        {optional && showOptional && <OptionalTag />}
      </label>
      <Hint name={name} text={hint} />
      <textarea
        {...rest}
        id={fieldId(name)}
        name={name}
        className={`${styles.control} ${styles.textarea}`}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      />
      <FieldError name={name} message={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  optional,
  showOptional = true,
  hint,
  error,
  options,
  placeholder = "Select…",
  ...rest
}: BaseFieldProps &
  ControlProps<SelectHTMLAttributes<HTMLSelectElement>> & {
    options: readonly ChoiceOption[];
    placeholder?: string;
  }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId(name)}>
        {label}
        {optional && showOptional && <OptionalTag />}
      </label>
      <Hint name={name} text={hint} />
      <select
        {...rest}
        id={fieldId(name)}
        name={name}
        className={`${styles.control} ${styles.select}`}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} message={error} />
    </div>
  );
}

interface GroupProps {
  name: FieldName;
  legend: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** fieldset + legend wrapper shared by the radio and chip groups. */
function Group({ name, legend, optional, hint, error, children }: GroupProps) {
  return (
    <fieldset
      className={styles.group}
      data-invalid={error ? "true" : undefined}
      aria-describedby={describedBy(name, hint, error)}
    >
      <legend className={styles.label}>
        {legend}
        {optional && <OptionalTag />}
      </legend>
      <Hint name={name} text={hint} />
      {children}
      <FieldError name={name} message={error} />
    </fieldset>
  );
}

/** Pick exactly one option, shown as cards. */
export function RadioGroup({
  name,
  legend,
  optional,
  hint,
  error,
  options,
  value,
  onChange,
}: Omit<GroupProps, "children"> & {
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Group name={name} legend={legend} optional={optional} hint={hint} error={error}>
      <div className={styles.cards}>
        {options.map((option) => (
          <label key={option.value} className={styles.choice}>
            <input
              type="radio"
              className={styles.choiceInput}
              name={name}
              value={option.value}
              checked={value === option.value}
              required={!optional}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.card}>
              <span className={styles.radioMark} aria-hidden="true" />
              <span className={styles.cardText}>
                <span className={styles.cardLabel}>{option.label}</span>
                {option.description && (
                  <span className={styles.cardDescription}>{option.description}</span>
                )}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Group>
  );
}

/** Pick any number of options, shown as chips. */
export function ChipGroup({
  name,
  legend,
  optional,
  hint,
  error,
  options,
  value,
  onChange,
}: Omit<GroupProps, "children"> & {
  options: readonly ChoiceOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );

  return (
    <Group name={name} legend={legend} optional={optional} hint={hint} error={error}>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.choice}>
            <input
              type="checkbox"
              className={styles.choiceInput}
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span className={styles.chip}>
              <svg
                className={styles.chipCheck}
                viewBox="0 0 16 16"
                width="14"
                height="14"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </Group>
  );
}

/** A single checkbox with a long label, e.g. the agreement. */
export function CheckboxField({
  name,
  checked,
  onChange,
  error,
  children,
}: {
  name: FieldName;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.agree}>
        <input
          type="checkbox"
          className={styles.agreeInput}
          id={fieldId(name)}
          name={name}
          checked={checked}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, undefined, error)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.agreeBox} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
            <path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
        <span className={styles.agreeText}>{children}</span>
      </label>
      <FieldError name={name} message={error} />
    </div>
  );
}

/** Vertical rhythm between the fields of a step. */
export function FieldStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

/** Standalone helper text between fields. */
export function FieldNote({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}

/** A titled cluster of related fields, e.g. one teammate. */
export function Subgroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className={styles.subgroup}>
      <legend className={styles.subLegend}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Two columns from tablet width up; stacked on phones. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
