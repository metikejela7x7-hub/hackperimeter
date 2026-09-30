import { describe, expect, it } from "vitest";
import { parseApplication } from "@/server/applications";
import { validBody } from "./fixtures";

describe("parseApplication", () => {
  it("accepts a valid solo application and normalises it", () => {
    const result = parseApplication(validBody());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.application).toMatchObject({
      fullName: "Ada Lovelace",
      portfolioUrl: "https://github.com/ada",
      teamMode: "solo",
      teammates: [],
      agreed: true,
    });
    expect(result.application).not.toHaveProperty("needs");
    expect(result.application).not.toHaveProperty("resumeId");
  });

  it("keeps team details and drops blank teammate rows", () => {
    const result = parseApplication(
      validBody({
        teamMode: "team",
        teamName: "Rocketeers",
        teammates: [{ name: "Grace", email: "grace@example.com" }, { name: "", email: "" }],
      }),
    );
    expect(result.ok && result.application).toMatchObject({
      teamName: "Rocketeers",
      teammates: [{ name: "Grace", email: "grace@example.com" }],
    });
  });

  it("drops team details from solo applications", () => {
    const result = parseApplication(
      validBody({ teamName: "Ghost", teammates: [{ name: "X", email: "x@example.com" }] }),
    );
    expect(result.ok && result.application).toMatchObject({ teammates: [] });
    expect(result.ok && result.application).not.toHaveProperty("teamName");
  });

  it("passes through a resume id", () => {
    const resumeId = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
    const result = parseApplication(validBody({ resumeId }));
    expect(result.ok && result.application.resumeId).toBe(resumeId);
  });

  it.each([
    ["not an object", "hello"],
    ["an array", []],
    ["wrong field type", validBody({ school: 42 })],
    ["unknown team mode", validBody({ teamMode: "squad" })],
    ["unknown interest", validBody({ interests: ["web", "crypto"] })],
    ["too many teammates", validBody({ teamMode: "team", teammates: Array(4).fill({ name: "A", email: "a@b.co" }) })],
    ["bad resume id", validBody({ resumeId: "../../etc/passwd" })],
  ])("rejects %s", (_label, body) => {
    expect(parseApplication(body).ok).toBe(false);
  });

  it("returns field errors from the shared form validation", () => {
    const result = parseApplication(validBody({ email: "nope", interests: [], agreed: true }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fields).toHaveProperty("email");
    expect(result.fields).toHaveProperty("interests");
  });

  it("requires agreement", () => {
    const result = parseApplication(validBody({ agreed: false }));
    expect(!result.ok && result.fields).toHaveProperty("agreed");
  });

  it("enforces the length limits the browser only suggests", () => {
    const result = parseApplication(validBody({ fullName: "A".repeat(101), needs: "x".repeat(601) }));
    expect(!result.ok && result.fields).toMatchObject({
      fullName: expect.any(String),
      needs: expect.any(String),
    });
  });

  it("rejects a teammate who is the applicant", () => {
    const result = parseApplication(
      validBody({ teamMode: "team", teammates: [{ name: "Me", email: "ADA@example.com" }] }),
    );
    expect(!result.ok && result.fields).toHaveProperty("teammate0Email");
  });
});
