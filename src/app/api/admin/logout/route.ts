import { serverError } from "@/server/http";
import { supabaseAuth } from "@/server/supabase";

/** POST /api/admin/logout: ends the session and returns to the sign-in page. */
export async function POST(request: Request) {
  try {
    const supabase = await supabaseAuth();
    await supabase.auth.signOut();
    return Response.redirect(new URL("/admin/login", request.url), 303);
  } catch (error) {
    return serverError("admin-logout", error);
  }
}
