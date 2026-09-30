import { adminEmails } from "./env";
import { supabaseAuth } from "./supabase";

export interface Admin {
  email: string;
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

/**
 * The signed-in admin, or null. Signed in is not enough: the email must also
 * be on the ADMIN_EMAILS allowlist, so removing someone takes effect at once.
 */
export async function getAdmin(): Promise<Admin | null> {
  const supabase = await supabaseAuth();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email || !isAdminEmail(email)) return null;
  return { email };
}
