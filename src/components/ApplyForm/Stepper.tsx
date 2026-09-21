import styles from "./Stepper.module.css";

interface StepperProps {
  steps: readonly { id: string; label: string }[];
  current: number;
  /** Called when a completed step is chosen. Later steps can't be skipped to. */
  onSelect: (index: number) => void;
}

export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <nav aria-label="Application progress">
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "todo";
          const body = (
            <>
              <span className={styles.number} aria-hidden="true">
                {state === "done" ? (
                  <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
                    <path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.label}>
                <span className="sr-only">Step {index + 1}: </span>
                {step.label}
                {state === "done" && <span className="sr-only"> (completed, edit)</span>}
              </span>
            </>
          );

          return (
            <li key={step.id} className={styles.item} data-state={state}>
              {state === "done" ? (
                <button type="button" className={styles.link} onClick={() => onSelect(index)}>
                  {body}
                </button>
              ) : (
                <span
                  className={styles.link}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
