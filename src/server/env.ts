/**
 * Server configuration, read from environment variables on each call (so tests
 * can change them). See .env.example for what each one is for.
 */

export class MissingConfigError extends Error {
  constructor(readonly variable: string) {
    super(`Missing environment variable ${variable}`);
    this.name = "MissingConfigError";
  }
}

/** A trimmed value, or undefined when the variable is unset or blank. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function requiredEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) throw new MissingConfigError(name);
  return value;
}

/** Lower-cased emails allowed into the admin dashboard (ADMIN_EMAILS, comma-separated). */
export function adminEmails(): string[] {
  return (optionalEnv("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Public origin of the site, without a trailing slash. Used in emails and sign-in links. */
export function siteUrl(): string {
  const explicit = optionalEnv("NEXT_PUBLIC_SITE_URL");
  const vercel = optionalEnv("VERCEL_PROJECT_PRODUCTION_URL");
  const url = explicit ?? (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
