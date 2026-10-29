import type { TeamUpdate } from "@/components/Admin/teamEdits";
import { type ApplicationRecord, listApplications, updateTeams } from "./applications";

const emailKey = (email: string) => email.trim().toLowerCase();

/**
 * Keeps "how are you applying?" consistent with who listed whom. When a new
 * application comes in:
 * - if someone on a team already listed the new applicant's email, the new
 *   applicant is on that team (taking its name if they gave none);
 * - if the new applicant listed people who applied as "Looking for a team",
 *   those people are moved onto the new applicant's team.
 * Only "Looking for a team" applications are ever switched, and team names are
 * only filled in, never overwritten, so a deliberate choice is left alone.
 */
export function planTeammateLinks(
  created: ApplicationRecord,
  others: readonly ApplicationRecord[],
): TeamUpdate[] {
  const updates: TeamUpdate[] = [];
  const me = emailKey(created.email);

  // 1. Did a team application list me?
  const lister = others.find(
    (o) => o.teamMode === "team" && o.teammates.some((t) => emailKey(t.email) === me),
  );
  if (lister && created.teamMode === "solo") {
    updates.push({
      id: created.id,
      patch: { teamMode: "team", teamName: created.teamName ?? lister.teamName },
    });
  } else if (lister && !created.teamName && lister.teamName) {
    updates.push({ id: created.id, patch: { teamName: lister.teamName } });
  }

  // 2. Did I list people who applied as "Looking for a team"?
  const myTeamName = created.teamName ?? lister?.teamName ?? null;
  if (created.teamMode === "team" || lister) {
    const listed = new Set(created.teammates.map((t) => emailKey(t.email)).filter(Boolean));
    for (const other of others) {
      if (other.teamMode !== "solo" || !listed.has(emailKey(other.email))) continue;
      updates.push({
        id: other.id,
        patch: { teamMode: "team", teamName: other.teamName ?? myTeamName },
      });
    }
  }
  return updates;
}

/**
 * Applies planTeammateLinks for a just-saved application and returns it as
 * saved afterwards. Never throws: a failure here must not lose the application.
 */
export async function linkListedTeammates(created: ApplicationRecord): Promise<ApplicationRecord> {
  try {
    const others = (await listApplications()).filter((a) => a.id !== created.id);
    const updates = planTeammateLinks(created, others);
    if (updates.length === 0) return created;
    const saved = await updateTeams(updates);
    return saved.find((a) => a.id === created.id) ?? created;
  } catch (error) {
    console.error("[team-links] could not link listed teammates", error);
    return created;
  }
}
