import type { ReactNode } from "react";
import styles from "./Button.module.css";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  size?: "md" | "lg";
  onClick?: () => void;
}

/** Link styled as a button. External URLs open in a new tab. */
export function Button({
  href,
  children,
  variant = "solid",
  size = "md",
  onClick,
}: ButtonProps) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>{children}</span>
      <svg
        className={styles.arrow}
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
    </a>
  );
}
