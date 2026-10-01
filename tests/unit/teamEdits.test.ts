import { describe, expect, it } from "vitest";
import { planTeamEdit, type TeamEdit, type TeamUpdate } from "@/components/Admin/teamEdits";
import { groupTeams } from "@/components/Admin/teams";
import type { ApplicationRecord } from "@/server/applications";
import { record } from "./fixtures";

/** Applies a plan's updates, the way the database would. */
function apply(applications: ApplicationRecord[], updates: TeamUpdate[]) {
  return applications.map((a) => {
    const update = updates.find((u) => u.id === a.id);
    return update ? { ...a, ...update.patch } : a;
  });
}

function edit(applications: ApplicationRecord[], id: string, change: TeamEdit) {
  const plan = planTeamEdit(applications, id, change);
  if (!plan.ok) throw new Error(plan.message);
  return apply(applications, plan.updates);
}

const memberNames = (applications: ApplicationRecord[]) =>
  groupTeams(applications).teams.map((t) => ({
    name: t.name,
    members: t.members.map((m) => m.application.fullName),
  }));

describe("planTeamEdit", () => {
  it("teams up two people looking for a team, without a name", () => {
    const sam = record({ fullName: "Sam" });
    const sara = record({ fullName: "Sara" });

    const after = edit([sam, sara], sam.id, { action: "link", withId: sara.id });

    expect(memberNames(after)).toEqual([{ name: null, members: ["Sam", "Sara"] }]);
    expect(groupTeams(after).lookingForTeam).toEqual([]);
    expect(after.every((a) => a.teamMode === "team")).toBe(true);
  });

  it("adds someone to an existing team and keeps its name", () => {
    const ada = record({
      fullName: "Ada",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "Grace", email: "grace@example.com" }],
    });
    const grace = record({
      fullName: "Grace",
      email: "grace@example.com",
      teamMode: "team",
      teamName: "Byte Me",
    });
    const sam = record({ fullName: "Sam" });

    const after = edit([ada, grace, sam], sam.id, { action: "link", withId: grace.id });

    expect(memberNames(after)).toEqual([{ name: "Byte Me", members: ["Ada", "Grace", "Sam"] }]);
    expect(after.find((a) => a.id === sam.id)?.teamName).toBe("Byte Me");
  });

  it("names a team for every member, and clears it with a blank name", () => {
    const sam = record({ fullName: "Sam" });
    const sara = record({ fullName: "Sara" });
    const linked = edit([sam, sara], sam.id, { action: "link", withId: sara.id });

    const named = edit(linked, sara.id, { action: "rename", teamName: "  Night   Owls " });
    expect(named.map((a) => a.teamName)).toEqual(["Night Owls", "Night Owls"]);

    const cleared = edit(named, sam.id, { action: "rename", teamName: "" });
    expect(cleared.map((a) => a.teamName)).toEqual([null, null]);
    expect(memberNames(cleared)).toEqual([{ name: null, members: ["Sam", "Sara"] }]);
  });

  it("removes someone from a team and puts them back to looking", () => {
    const sam = record({ fullName: "Sam" });
    const sara = record({ fullName: "Sara" });
    const kai = record({ fullName: "Kai" });
    let apps = edit([sam, sara, kai], sam.id, { action: "link", withId: sara.id });
    apps = edit(apps, kai.id, { action: "link", withId: sara.id });
    apps = edit(apps, sam.id, { action: "rename", teamName: "Trio" });

    const after = edit(apps, kai.id, { action: "unlink" });

    expect(memberNames(after)).toEqual([{ name: "Trio", members: ["Sam", "Sara"] }]);
    expect(groupTeams(after).lookingForTeam.map((a) => a.fullName)).toEqual(["Kai"]);
    expect(after.find((a) => a.id === sara.id)?.teammates.map((t) => t.name)).toEqual(["Sam"]);
  });

  it("refuses edits that make no sense", () => {
    const sam = record({ fullName: "Sam" });
    const sara = record({ fullName: "Sara" });
    expect(planTeamEdit([sam], sam.id, { action: "link", withId: sam.id }).ok).toBe(false);
    expect(planTeamEdit([sam], sam.id, { action: "unlink" }).ok).toBe(false);
    expect(planTeamEdit([sam], sam.id, { action: "rename", teamName: "Solo" }).ok).toBe(false);
    expect(
      planTeamEdit([sam, sara], sam.id, { action: "rename", teamName: "x".repeat(61) }).ok,
    ).toBe(false);

    const linked = edit([sam, sara], sam.id, { action: "link", withId: sara.id });
    expect(planTeamEdit(linked, sara.id, { action: "link", withId: sam.id }).ok).toBe(false);
  });
});
