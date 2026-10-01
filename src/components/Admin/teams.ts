import type { ApplicationRecord } from "@/server/applications";

export interface TeamMember {
  application: ApplicationRecord;
  /**
   * True when this person is on the team only because their team name matches,
   * not because anyone listed their email. Worth a quick check by an organizer.
   */
  matchedByName: boolean;
}

/** Someone a member listed as a teammate who hasn't applied (no application with that email). */
export interface MissingTeammate {
  name: string;
  email: string;
  /** Full names of the members who listed them. */
  listedBy: string[];
}

export interface Team {
  /** Stable key for React lists. */
  key: string;
  /** The team name most members entered, or null if nobody gave one. */
  name: string | null;
  members: TeamMember[];
  missing: MissingTeammate[];
}

export interface TeamGroups {
  teams: Team[];
  /** Applicants looking for a team whom no one listed as a teammate. */
  lookingForTeam: ApplicationRecord[];
}

const emailKey = (email: string) => email.trim().toLowerCase();
/** "Byte Me", "byteme" and "BYTE-ME!" all match. */
const teamNameKey = (name: string | null) => (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Groups applications into teams. Two applications are on the same team when
 * either lists the other's email as a teammate, or (as a fallback) when both
 * applied as a team under the same team name.
 */
export function groupTeams(applications: readonly ApplicationRecord[]): TeamGroups {
  const byEmail = new Map(applications.map((a) => [emailKey(a.email), a]));

  // Union-find over application ids.
  const parent = new Map(applications.map((a) => [a.id, a.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  // 1. Email links: the reliable signal.
  for (const application of applications) {
    if (application.teamMode !== "team") continue;
    for (const mate of application.teammates) {
      const other = byEmail.get(emailKey(mate.email));
      if (other && other.id !== application.id) union(application.id, other.id);
    }
  }
  const emailGroup = new Map(applications.map((a) => [a.id, find(a.id)]));

  // 2. Team-name links: catches teammates who didn't list each other.
  const firstWithName = new Map<string, string>();
  for (const application of applications) {
    const key = teamNameKey(application.teamName);
    if (application.teamMode !== "team" || !key) continue;
    const first = firstWithName.get(key);
    if (first) union(application.id, first);
    else firstWithName.set(key, application.id);
  }

  const groups = new Map<string, ApplicationRecord[]>();
  for (const application of applications) {
    const root = find(application.id);
    groups.set(root, [...(groups.get(root) ?? []), application]);
  }

  const teams: Team[] = [];
  const lookingForTeam: ApplicationRecord[] = [];
  for (const [root, members] of groups) {
    if (members.length === 1 && members[0].teamMode === "solo") {
      lookingForTeam.push(members[0]);
      continue;
    }

    // Members outside the largest email-linked cluster joined by name alone.
    const clusterSizes = new Map<string, number>();
    for (const m of members) {
      const cluster = emailGroup.get(m.id)!;
      clusterSizes.set(cluster, (clusterSizes.get(cluster) ?? 0) + 1);
    }
    const mainCluster = [...clusterSizes].sort((p, q) => q[1] - p[1])[0][0];

    const missing = new Map<string, MissingTeammate>();
    for (const m of members) {
      if (m.teamMode !== "team") continue;
      for (const mate of m.teammates) {
        const key = emailKey(mate.email);
        if (!key || byEmail.has(key)) continue;
        const entry = missing.get(key) ?? {
          name: mate.name.trim(),
          email: mate.email.trim(),
          listedBy: [],
        };
        if (!entry.listedBy.includes(m.fullName)) entry.listedBy.push(m.fullName);
        missing.set(key, entry);
      }
    }

    teams.push({
      key: root,
      name: mostCommonName(members),
      members: members
        .map((application) => ({
          application,
          matchedByName: clusterSizes.size > 1 && emailGroup.get(application.id) !== mainCluster,
        }))
        .sort((p, q) => p.application.fullName.localeCompare(q.application.fullName)),
      missing: [...missing.values()],
    });
  }

  teams.sort((p, q) => (p.name ?? "￿").localeCompare(q.name ?? "￿"));
  lookingForTeam.sort((p, q) => p.fullName.localeCompare(q.fullName));
  return { teams, lookingForTeam };
}

/** The team name members entered most often, as first typed. */
function mostCommonName(members: readonly ApplicationRecord[]): string | null {
  const counts = new Map<string, { name: string; count: number }>();
  for (const m of members) {
    const key = teamNameKey(m.teamName);
    if (!key) continue;
    const entry = counts.get(key) ?? { name: m.teamName!.trim(), count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((p, q) => q.count - p.count)[0]?.name ?? null;
}
