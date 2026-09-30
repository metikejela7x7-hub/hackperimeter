import { createHash, timingSafeEqual } from "node:crypto";
import { MissingConfigError } from "./env";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return Response.json({ error, ...extra }, { status });
}

export const unauthorized = () => jsonError(401, "Sign in as an admin to do that.");

/** Logs an unexpected failure and returns a generic 500 (or 503 when unconfigured). */
export function serverError(context: string, error: unknown) {
  if (error instanceof MissingConfigError) {
    console.error(`[${context}] ${error.message}`);
    return jsonError(503, "This service isn't set up yet. Please try again later.");
  }
  console.error(`[${context}]`, error);
  return jsonError(500, "Something went wrong on our side. Please try again.");
}

/** True when the request carries `Authorization: Bearer $CRON_SECRET` (what Vercel Cron sends). */
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  // Compare fixed-length digests so the check takes the same time for any guess.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(
    digest(request.headers.get("authorization") ?? ""),
    digest(`Bearer ${secret}`),
  );
}
