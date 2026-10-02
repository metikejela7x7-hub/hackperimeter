import type { ApplicationRecord } from "./applications";
import { sendEmail, teammateInviteEmail } from "./email";
import { optionalEnv, siteUrl } from "./env";
import { supabaseAdmin } from "./supabase";

/** What the apply form pre-fills from an invite link. */
export interface Invite {
  /** The invitee's own address, as their teammate typed it. */
  email: string;
  inviterName: string;
  inviterEmail: string;
  teamName: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the teammate_invites table hasn't been created yet (migration 0002 not run). */
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/** Escapes LIKE wildcards so an address matches only itself. */
const exactly = (value: string) => value.replace(/[\\%_]/g, "\\$&");

/**
 * Emails each teammate listed on a team application an invite to apply.
 * Safeguards: only with a verified sender (EMAIL_FROM), never to someone who
 * has already applied, and at most once per address ever (teammate_invites).
 * Never throws: invites are a nice-to-have and must not affect the application.
 */
export async function sendTeammateInvites(application: ApplicationRecord): Promise<void> {
  try {
    if (application.teamMode !== "team" || !optionalEnv("EMAIL_FROM")) return;
    const db = supabaseAdmin();
    const own = application.email.trim().toLowerCase();
    const listed = [
      ...new Map(
        application.teammates
          .map((mate) => ({ name: mate.name.trim(), email: mate.email.trim().toLowerCase() }))
          .filter((mate) => mate.email && mate.email !== own)
          .map((mate) => [mate.email, mate]),
      ).values(),
    ].slice(0, 3);

    for (const mate of listed) {
      const { data: applied, error: lookupError } = await db
        .from("applications")
        .select("id")
        .ilike("email", exactly(mate.email))
        .limit(1);
      if (lookupError) throw lookupError;
      if (applied && applied.length > 0) continue;

      // Claim the address. If a row already exists, it was invited before: skip.
      const { data: claimed, error: claimError } = await db
        .from("teammate_invites")
        .upsert(
          { email: mate.email, invited_by: application.id },
          { onConflict: "email", ignoreDuplicates: true },
        )
        .select("id");
      if (isMissingTable(claimError)) {
        console.warn("[invites] teammate_invites table missing; run migration 0002. Skipping.");
        return;
      }
      if (claimError) throw claimError;
      const invite = claimed?.[0] as { id: string } | undefined;
      if (!invite) continue;

      const sent = await sendEmail(
        teammateInviteEmail({
          to: mate.email,
          inviterName: application.fullName,
          teamName: application.teamName,
          link: `${siteUrl()}/apply?invite=${invite.id}`,
        }),
      );
      // Not delivered: release the claim so a later listing can try again.
      if (!sent) await db.from("teammate_invites").delete().eq("id", invite.id);
    }
  } catch (error) {
    console.error("[invites] could not send teammate invites", error);
  }
}

/** The details behind an invite link, or null if it's unknown or its inviter was removed. */
export async function getInvite(id: string): Promise<Invite | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabaseAdmin()
    .from("teammate_invites")
    .select("email, inviter:applications(full_name, email, team_name)")
    .eq("id", id)
    .maybeSingle<{
      email: string;
      inviter: { full_name: string; email: string; team_name: string | null } | null;
    }>();
  if (isMissingTable(error)) return null;
  if (error) throw error;
  if (!data?.inviter) return null;
  return {
    email: data.email,
    inviterName: data.inviter.full_name,
    inviterEmail: data.inviter.email,
    teamName: data.inviter.team_name,
  };
}
