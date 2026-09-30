import { describe, expect, it } from "vitest";
import { computeStats, daysUntilEvent, recapEmbed } from "@/server/stats";
import { record } from "./fixtures";

const NOW = new Date("2026-10-02T13:00:00.000Z");

describe("computeStats", () => {
  const applications = [
    record({ createdAt: "2026-10-02T09:00:00.000Z", status: "accepted", experience: "advanced", hasResume: true }),
    record({ createdAt: "2026-10-01T14:00:00.000Z", school: "perimeter  college", teamMode: "team" }),
    record({ createdAt: "2026-09-20T10:00:00.000Z", school: "Georgia State", status: "rejected" }),
  ];
  const stats = computeStats(applications, NOW);

  it("counts totals and the last 24 hours", () => {
    expect(stats.total).toBe(3);
    expect(stats.last24h).toBe(2);
  });

  it("counts every status, including zeroes", () => {
    expect(stats.byStatus).toEqual({ pending: 1, accepted: 1, waitlisted: 0, rejected: 1 });
  });

  it("groups school spellings", () => {
    expect(stats.topSchools[0]).toEqual({ label: "Perimeter College", count: 2 });
  });

  it("counts teams and resumes", () => {
    expect(stats).toMatchObject({ team: 1, solo: 2, withResume: 1 });
  });

  it("builds a Discord recap", () => {
    const embed = recapEmbed(stats, NOW);
    expect(embed.title).toBe("Daily recap: 2 new applications");
    expect(embed.description).toContain("35 days until HackPerimeter");
    expect(embed.fields?.every((field) => field.value.length > 0 && field.value.length <= 1024)).toBe(true);
  });
});

describe("daysUntilEvent", () => {
  it("is zero on and after the event", () => {
    expect(daysUntilEvent(new Date("2026-11-06T15:00:00.000Z"))).toBe(0);
    expect(daysUntilEvent(new Date("2026-12-01T00:00:00.000Z"))).toBe(0);
  });
});
