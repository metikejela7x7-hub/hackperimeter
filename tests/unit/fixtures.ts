import type { ApplicationRecord } from "@/server/applications";

export function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: "  Ada Lovelace ",
    email: "ada@example.com",
    school: "Perimeter College",
    graduationYear: "2027",
    major: "Computer Science",
    experience: "intermediate",
    interests: ["web", "ai"],
    portfolioUrl: "github.com/ada",
    teamMode: "solo",
    teammates: [],
    needs: "",
    agreed: true,
    ...overrides,
  };
}

let counter = 0;

export function record(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  counter += 1;
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
    createdAt: "2026-10-01T12:00:00.000Z",
    fullName: `Person ${counter}`,
    email: `person${counter}@example.com`,
    school: "Perimeter College",
    graduationYear: "2027",
    major: "CS",
    experience: "beginner",
    interests: ["web"],
    portfolioUrl: null,
    teamMode: "solo",
    teamName: null,
    teammates: [],
    needs: null,
    hasResume: false,
    status: "pending",
    ...overrides,
  };
}
