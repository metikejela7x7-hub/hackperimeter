import { describe, expect, it } from "vitest";
import { groupTeams } from "@/components/Admin/teams";
import { record } from "./fixtures";

const names = (team: { members: { application: { fullName: string } }[] }) =>
  team.members.map((m) => m.application.fullName);

describe("groupTeams", () => {
  it("links teammates who list each other's email, in any letter case", () => {
    const ada = record({
      fullName: "Ada",
      email: "ada@example.com",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "Grace", email: "GRACE@example.com" }],
    });
    const grace = record({
      fullName: "Grace",
      email: "grace@example.com",
      teamMode: "team",
      teamName: "byte me",
    });

    const { teams, lookingForTeam } = groupTeams([ada, grace]);

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe("Byte Me");
    expect(names(teams[0])).toEqual(["Ada", "Grace"]);
    expect(teams[0].members.every((m) => !m.matchedByName)).toBe(true);
    expect(lookingForTeam).toEqual([]);
  });

  it("falls back to matching team names, and flags those members", () => {
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
    const linus = record({ fullName: "Linus", teamMode: "team", teamName: "BYTE-ME!" });

    const [team] = groupTeams([ada, grace, linus]).teams;

    expect(names(team)).toEqual(["Ada", "Grace", "Linus"]);
    expect(team.members.find((m) => m.application.fullName === "Linus")?.matchedByName).toBe(true);
    expect(team.members.find((m) => m.application.fullName === "Ada")?.matchedByName).toBe(false);
  });

  it("lists teammates who haven't applied yet", () => {
    const ada = record({
      fullName: "Ada",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "Linus", email: "linus@example.com" }],
    });
    const grace = record({
      fullName: "Grace",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "Linus T", email: "Linus@example.com" }],
    });

    const [team] = groupTeams([ada, grace]).teams;

    expect(team.missing).toEqual([
      { name: "Linus", email: "linus@example.com", listedBy: ["Ada", "Grace"] },
    ]);
  });

  it("keeps solo applicants in the looking-for-a-team list unless someone listed them", () => {
    const solo = record({ fullName: "Solo" });
    const listed = record({ fullName: "Listed", email: "listed@example.com" });
    const ada = record({
      fullName: "Ada",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "Listed", email: "listed@example.com" }],
    });

    const { teams, lookingForTeam } = groupTeams([solo, listed, ada]);

    expect(lookingForTeam.map((a) => a.fullName)).toEqual(["Solo"]);
    expect(names(teams[0])).toEqual(["Ada", "Listed"]);
  });

  it("shows a team applicant on their own when nobody matches", () => {
    const ada = record({ fullName: "Ada", teamMode: "team", teamName: "Lonely" });
    const { teams } = groupTeams([ada]);
    expect(teams).toHaveLength(1);
    expect(names(teams[0])).toEqual(["Ada"]);
  });

  it("recognizes a member a teammate listed under a different email", () => {
    const ada = record({
      fullName: "Ada Example",
      teamMode: "team",
      teamName: "Byte Me",
      teammates: [{ name: "alex  smith", email: "alex@student.gsu.edu" }],
    });
    const alex = record({
      fullName: "Alex Smith",
      email: "alex@gmail.com",
      teamMode: "team",
      teamName: "Byte Me",
    });

    const [team] = groupTeams([ada, alex]).teams;

    expect(team.missing).toEqual([]);
    const member = team.members.find((m) => m.application.fullName === "Alex Smith")!;
    expect(member.alsoListedAs).toEqual(["alex@student.gsu.edu"]);
    expect(member.matchedByName).toBe(false);
  });

  it("matches a first name only when exactly one member has it", () => {
    const lister = (name: string) =>
      record({
        fullName: "Ada Example",
        teamMode: "team",
        teamName: "Owls",
        teammates: [{ name, email: "someone@school.edu" }],
      });
    const alex = record({ fullName: "Alex Smith", teamMode: "team", teamName: "Owls" });
    const alexJones = record({ fullName: "Alex Jones", teamMode: "team", teamName: "Owls" });

    expect(groupTeams([lister("Alex"), alex]).teams[0].missing).toEqual([]);
    // Two Alexes: can't tell which, so leave it as a separate "hasn't applied" entry.
    expect(groupTeams([lister("Alex"), alex, alexJones]).teams[0].missing).toHaveLength(1);
  });

  it("never merges people with different names", () => {
    const ada = record({
      fullName: "Ada Example",
      teamMode: "team",
      teamName: "Owls",
      teammates: [{ name: "Linus Torvalds", email: "linus@school.edu" }],
    });
    const alex = record({ fullName: "Alex Smith", teamMode: "team", teamName: "Owls" });
    const [team] = groupTeams([ada, alex]).teams;
    expect(team.missing.map((m) => m.name)).toEqual(["Linus Torvalds"]);
    expect(team.members.every((m) => m.alsoListedAs.length === 0)).toBe(true);
  });
});
