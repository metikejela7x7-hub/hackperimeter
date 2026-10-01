import type { Teammate } from "@/components/ApplyForm/types";
import type { ApplicationRecord } from "@/server/applications";
import { groupTeams } from "./teams";

/** Team fields an organizer can change on an application. */
export interface TeamPatch {
  teamMode?: "solo" | "team";
  teamName?: string | null;
  teammates?: Teammate[];
}

export interface TeamUpdate {
  id: string;
  patch: TeamPatch;
}

export type TeamEdit =
  | { action: "link"; withId: string }
  | { action: "unlink" }
  | { action: "rename"; teamName: string };

export type TeamPlan = { ok: true; updates: TeamUpdate[] } | { ok: false; message: string };

export const TEAM_NAME_MAX = 60;

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Everyone on the same team as `id` (including them), or just them if they have no team. */
function teamOf(applications: readonly ApplicationRecord[], id: string) {
  const team = groupTeams(applications).teams.find((t) =>
    t.members.some((m) => m.application.id === id),
  );
  return {
    name: team?.name ?? null,
    members: team
      ? team.members.map((m) => m.application)
      : applications.filter((a) => a.id === id),
  };
}

/** Collects patches per application so each row is written once. */
class Updates {
  private byId = new Map<string, TeamPatch>();
  set(id: string, patch: TeamPatch) {
    this.byId.set(id, { ...this.byId.get(id), ...patch });
  }
  get(id: string) {
    return this.byId.get(id);
  }
  list(): TeamUpdate[] {
    return [...this.byId].map(([id, patch]) => ({ id, patch }));
  }
}

/**
 * Works out the changes for an organizer's team edit:
 * - link: put two people (and whoever they're already teamed with) on one team,
 *   by adding each to the other's teammate list. Keeps an existing team name.
 * - unlink: take someone off their team; they go back to looking for one.
 * - rename: set (or clear) the team name for everyone on their team.
 */
export function planTeamEdit(
  applications: readonly ApplicationRecord[],
  id: string,
  edit: TeamEdit,
): TeamPlan {
  const me = applications.find((a) => a.id === id);
  if (!me) return { ok: false, message: "Application not found." };
  const updates = new Updates();

  if (edit.action === "link") {
    const other = applications.find((a) => a.id === edit.withId);
    if (!other) return { ok: false, message: "Couldn't find the person to team up with." };
    if (other.id === me.id) return { ok: false, message: "Pick someone other than themselves." };

    const mine = teamOf(applications, me.id);
    const theirs = teamOf(applications, other.id);
    if (mine.members.some((m) => m.id === other.id)) {
      return { ok: false, message: `${me.fullName} and ${other.fullName} are already on a team.` };
    }

    // Joining an existing team keeps its name; otherwise keep whichever side had one.
    const name = theirs.name ?? mine.name;
    for (const member of [...mine.members, ...theirs.members]) {
      updates.set(member.id, { teamMode: "team", teamName: name });
    }
    const addMate = (to: ApplicationRecord, mate: ApplicationRecord) => {
      const current = updates.get(to.id)?.teammates ?? to.teammates;
      if (current.some((t) => sameEmail(t.email, mate.email))) return;
      updates.set(to.id, { teammates: [...current, { name: mate.fullName, email: mate.email }] });
    };
    addMate(me, other);
    addMate(other, me);
    return { ok: true, updates: updates.list() };
  }

  if (edit.action === "unlink") {
    const team = teamOf(applications, me.id);
    if (team.members.length === 1 && me.teamMode === "solo") {
      return { ok: false, message: `${me.fullName} isn't on a team.` };
    }
    updates.set(me.id, { teamMode: "solo", teamName: null, teammates: [] });
    for (const other of applications) {
      if (other.id === me.id || !other.teammates.some((t) => sameEmail(t.email, me.email)))
        continue;
      updates.set(other.id, {
        teammates: other.teammates.filter((t) => !sameEmail(t.email, me.email)),
      });
    }
    return { ok: true, updates: updates.list() };
  }

  const teamName = edit.teamName.trim().replace(/\s+/g, " ");
  if (teamName.length > TEAM_NAME_MAX) {
    return { ok: false, message: `Keep team names under ${TEAM_NAME_MAX} characters.` };
  }
  const team = teamOf(applications, me.id);
  if (team.members.length === 1 && me.teamMode === "solo") {
    return { ok: false, message: "Team them up with someone first, then name the team." };
  }
  for (const member of team.members) {
    updates.set(member.id, { teamMode: "team", teamName: teamName || null });
  }
  return { ok: true, updates: updates.list() };
}

/** Reads a request body as a TeamEdit, or null if it isn't one. */
export function parseTeamEdit(body: unknown): TeamEdit | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  if (input.action === "link" && typeof input.withId === "string") {
    return { action: "link", withId: input.withId };
  }
  if (input.action === "unlink") return { action: "unlink" };
  if (input.action === "rename" && typeof input.teamName === "string") {
    return { action: "rename", teamName: input.teamName };
  }
  return null;
}
