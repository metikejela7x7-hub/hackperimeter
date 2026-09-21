import type { ButtonHTMLAttributes, ReactNode } from "react";
import buttonStyles from "@/components/Button/Button.module.css";
import styles from "./FormButton.module.css";

interface FormButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type"> {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "solid" | "ghost";
  size?: "md" | "lg";
  /** Show the trailing arrow (matches the link Button). */
  arrow?: boolean;
}

/** A real <button> with the same look as the link Button, for form actions. */
export function FormButton({
  children,
  type = "button",
  variant = "solid",
  size = "md",
  arrow = false,
  ...rest
}: FormButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonStyles.button} ${buttonStyles[variant]} ${buttonStyles[size]} ${styles.button} ${variant === "ghost" ? styles.ghost : ""}`}
      {...rest}
    >
      <span>{children}</span>
      {arrow && (
        <svg
          className={buttonStyles.arrow}
          viewBox="0 0 20 20"
          width="18"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M4 10h11M11 5.5 15.5 10 11 14.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="square"
          />
        </svg>
      )}
    </button>
  );
}
