import { describe, expect, it, vi } from "vitest";
import { validBody } from "./fixtures";

vi.mock("@/data/event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/data/event")>()),
  REGISTRATION_OPEN: false,
}));
const createApplication = vi.hoisted(() => vi.fn());
vi.mock("@/server/applications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/applications")>()),
  createApplication,
}));

const applications = await import("@/app/api/applications/route");
const upload = await import("@/app/api/resume/upload/route");

describe("with registration closed", () => {
  it("rejects new applications without saving anything", async () => {
    const response = await applications.POST(
      new Request("http://localhost/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody()),
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Registration is closed." });
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("rejects resume uploads", async () => {
    const form = new FormData();
    form.append("resume", new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" }));
    const response = await upload.POST(
      new Request("http://localhost/api/resume/upload", { method: "POST", body: form }),
    );
    expect(response.status).toBe(403);
  });
});
