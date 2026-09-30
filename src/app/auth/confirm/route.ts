import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseAuth } from "@/server/supabase";

/**
 * GET /auth/confirm: where the admin sign-in email lands. Handles both forms
 * Supabase can send:
 *   ?code=…                       default email template (open the link in the
 *                                 same browser that requested it)
 *   ?token_hash=…&type=email      custom template (works on any device)
 * Sets the session cookie, then opens /admin.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await supabaseAuth();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("Sign-in link is missing its token") };
    if (!error) return Response.redirect(new URL("/admin", url), 303);
    console.error("[auth-confirm] sign-in failed", error);
  } catch (error) {
    console.error("[auth-confirm]", error);
  }
  return Response.redirect(new URL("/admin/login?error=link", url), 303);
}
