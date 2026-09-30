import { supabaseAdmin } from "./supabase";

export interface RateLimit {
  /** Name of the bucket, e.g. "apply". Combined with the caller's IP. */
  name: string;
  windowSeconds: number;
  max: number;
}

export const RATE_LIMITS = {
  apply: { name: "apply", windowSeconds: 60 * 60, max: 5 },
  resumeUpload: { name: "resume-upload", windowSeconds: 60 * 60, max: 10 },
  adminLogin: { name: "admin-login", windowSeconds: 15 * 60, max: 5 },
} satisfies Record<string, RateLimit>;

/** The caller's IP as reported by Vercel's proxy (first hop of x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Counts one request against `limit` for this caller. Returns false once they
 * are over it. Fails open: if the database check errors, the request is let
 * through rather than blocking real applicants.
 */
export async function withinRateLimit(request: Request, limit: RateLimit): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("rate_limit_hit", {
    p_key: `${limit.name}:${clientIp(request)}`,
    p_window_seconds: limit.windowSeconds,
    p_max: limit.max,
  });
  if (error) {
    console.error("[rate-limit] check failed; allowing request", error);
    return true;
  }
  return data === true;
}

/** Deletes counters from windows that ended more than a day ago. */
export async function pruneRateLimits(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin().from("rate_limits").delete().lt("window_start", cutoff);
  if (error) throw error;
}
