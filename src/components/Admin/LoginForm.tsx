"use client";

import { useState, type FormEvent } from "react";
import { FormButton } from "@/components/FormButton/FormButton";
import styles from "./Admin.module.css";

export function LoginForm({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(initialError);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setState("sending");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't send the link. Try again.");
      }
      setState("sent");
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Couldn't send the link. Try again.");
    }
  };

  if (state === "sent") {
    return (
      <p className={styles.notice} role="status">
        If <strong>{email}</strong> is on the exec list, a sign-in link is on its way. It
        expires in an hour.
      </p>
    );
  }

  return (
    <form className={styles.loginForm} onSubmit={submit}>
      <label className={styles.label} htmlFor="admin-email">
        Email
      </label>
      <input
        id="admin-email"
        className={styles.input}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <FormButton type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </FormButton>
    </form>
  );
}
