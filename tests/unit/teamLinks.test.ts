import { describe, expect, it } from "vitest";
import { planTeammateLinks } from "@/server/teamLinks";
import { record } from "./fixtures";

const ada = (overrides = {}) =>
  record({
    fullName: "Ada",
    email: "ada@example.com",
    teamMode: "team",
    teamName: "Byte Me",
    teammates: [{ name: "Sam", email: "SAM@example.com" }],
    ...overrides,
  });

describe("planTeammateLinks", () => {
  it("puts a 'looking for a team' applicant on the team that listed them", () => {
    const sam = record({ fullName: "Sam", email: "sam@example.com", teamMode: "solo" });
    expect(planTeammateLinks(sam, [ada()])).toEqual([
      { id: sam.id, patch: { teamMode: "team", teamName: "Byte Me" } },
    ]);
  });

  it("moves people who already applied solo onto the team that just listed them", () => {
    const sam = record({ fullName: "Sam", email: "sam@example.com", teamMode: "solo" });
    const newcomer = ada();
    expect(planTeammateLinks(newcomer, [sam])).toEqual([
      { id: sam.id, patch: { teamMode: "team", teamName: "Byte Me" } },
    ]);
  });

  it("fills in a missing team name but never overwrites one", () => {
    const unnamed = record({ email: "sam@example.com", teamMode: "team", teamName: null });
    expect(planTeammateLinks(unnamed, [ada()])).toEqual([
      { id: unnamed.id, patch: { teamName: "Byte Me" } },
    ]);
    const named = record({ email: "sam@example.com", teamMode: "team", teamName: "Owls" });
    expect(planTeammateLinks(named, [ada()])).toEqual([]);
  });

  it("leaves people alone when nobody listed them", () => {
    const sam = record({ email: "sam@example.com", teamMode: "solo" });
    const kai = record({ email: "kai@example.com", teamMode: "solo" });
    expect(planTeammateLinks(sam, [kai, ada({ teammates: [] })])).toEqual([]);
  });

  it("never switches someone who chose a different team", () => {
    const sam = record({ email: "sam@example.com", teamMode: "team", teamName: "Owls" });
    expect(planTeammateLinks(ada(), [sam])).toEqual([]);
  });
});
