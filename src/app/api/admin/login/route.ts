import { EMAIL_PATTERN } from "@/components/ApplyForm/validation";
import { isAdminEmail } from "@/server/auth";
import { jsonError, serverError } from "@/server/http";
import { RATE_LIMITS, withinRateLimit } from "@/server/rateLimit";
import { supabaseAuth } from "@/server/supabase";

/**
 * POST /api/admin/login { email }: emails a sign-in link to allowlisted admins.
 * Always answers the same way, so it can't be used to discover who is an admin.
 * The link returns to the same site it was requested from (local, preview or
 * production); Supabase only honours origins listed under its Redirect URLs.
 */
export async function POST(request: Request) {
  try {
    if (!(await withinRateLimit(request, RATE_LIMITS.adminLogin))) {
      return jsonError(429, "Too many attempts. Please wait 15 minutes and try again.");
    }
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_PATTERN.test(email)) return jsonError(400, "Enter a valid email address.");

    if (isAdminEmail(email)) {
      const supabase = await supabaseAuth();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: `${new URL(request.url).origin}/auth/confirm` },
      });
      if (error) console.error("[admin-login] could not send sign-in link", error);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return serverError("admin-login", error);
  }
}
