import { beforeEach, describe, expect, it, vi } from "vitest";
import { record, validBody } from "./fixtures";

const mocks = vi.hoisted(() => ({
  createApplication: vi.fn(),
  listApplications: vi.fn(),
  updateStatus: vi.fn(),
  getAdmin: vi.fn(),
  withinRateLimit: vi.fn(),
  notifyNewApplication: vi.fn(),
  postToDiscord: vi.fn(),
  after: vi.fn(),
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/server/applications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/applications")>()),
  createApplication: mocks.createApplication,
  listApplications: mocks.listApplications,
  updateStatus: mocks.updateStatus,
}));
vi.mock("@/server/auth", () => ({ getAdmin: mocks.getAdmin }));
vi.mock("@/server/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/rateLimit")>()),
  withinRateLimit: mocks.withinRateLimit,
}));
vi.mock("@/server/notifications", () => ({ notifyNewApplication: mocks.notifyNewApplication }));
vi.mock("@/server/discord", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/discord")>()),
  postToDiscord: mocks.postToDiscord,
}));

const applications = await import("@/app/api/applications/route");
const adminApplication = await import("@/app/api/admin/applications/[id]/route");
const checkinSheet = await import("@/app/api/admin/checkin-sheet/route");
const recap = await import("@/app/api/cron/daily-recap/route");

const post = (body: unknown) =>
  new Request("http://localhost/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mocks.withinRateLimit.mockResolvedValue(true);
  mocks.getAdmin.mockResolvedValue({ email: "exec@example.com" });
});

describe("POST /api/applications", () => {
  it("creates the application and notifies after responding", async () => {
    const created = record();
    mocks.createApplication.mockResolvedValue({ kind: "created", application: created });

    const response = await applications.POST(post(validBody()));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: created.id });
    expect(mocks.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Ada Lovelace", email: "ada@example.com" }),
    );
    expect(mocks.after).toHaveBeenCalledOnce();
    await mocks.after.mock.calls[0][0]();
    expect(mocks.notifyNewApplication).toHaveBeenCalledWith(created);
  });

  it("returns field errors for invalid answers", async () => {
    const response = await applications.POST(post(validBody({ email: "bad" })));
    expect(response.status).toBe(400);
    expect((await response.json()).fields).toHaveProperty("email");
    expect(mocks.createApplication).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    expect((await applications.POST(post("{nope"))).status).toBe(400);
  });

  it("returns 409 for a repeat email", async () => {
    mocks.createApplication.mockResolvedValue({ kind: "duplicate" });
    const response = await applications.POST(post(validBody()));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/already/);
  });

  it("rate limits", async () => {
    mocks.withinRateLimit.mockResolvedValue(false);
    expect((await applications.POST(post(validBody()))).status).toBe(429);
    expect(mocks.createApplication).not.toHaveBeenCalled();
  });

  it("hides internal errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createApplication.mockRejectedValue(new Error("db password is hunter2"));
    const response = await applications.POST(post(validBody()));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("hunter2");
  });
});

describe("admin routes", () => {
  const id = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
  const patch = (body: unknown) =>
    adminApplication.PATCH(
      new Request(`http://localhost/api/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("refuses anyone who isn't an admin", async () => {
    mocks.getAdmin.mockResolvedValue(null);
    expect((await patch({ status: "accepted" })).status).toBe(401);
    expect((await checkinSheet.GET(new Request("http://localhost/api/admin/checkin-sheet"))).status).toBe(401);
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects unknown statuses", async () => {
    expect((await patch({ status: "maybe" })).status).toBe(400);
  });

  it("queues the acceptance email only when needed", async () => {
    mocks.updateStatus.mockResolvedValue({ application: record({ status: "accepted" }), needsAcceptanceEmail: true });
    const response = await patch({ status: "accepted" });
    expect(response.status).toBe(200);
    expect((await response.json()).acceptanceEmailQueued).toBe(true);
    expect(mocks.after).toHaveBeenCalledOnce();

    mocks.after.mockClear();
    mocks.updateStatus.mockResolvedValue({ application: record(), needsAcceptanceEmail: false });
    await patch({ status: "pending" });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("serves the check-in sheet for accepted applicants", async () => {
    mocks.listApplications.mockResolvedValue([record({ status: "accepted" }), record({ status: "pending" })]);
    const response = await checkinSheet.GET(new Request("http://localhost/api/admin/checkin-sheet"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("spreadsheetml");
    expect(response.headers.get("content-disposition")).toContain("checkin-accepted");
  });
});

describe("GET /api/cron/daily-recap", () => {
  const cron = (auth?: string) =>
    recap.GET(new Request("http://localhost/api/cron/daily-recap", { headers: auth ? { authorization: auth } : {} }));

  it("requires the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await cron()).status).toBe(401);
    expect((await cron("Bearer wrong")).status).toBe(401);
  });

  it("refuses everything when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await cron("Bearer ")).status).toBe(401);
  });

  it("posts the recap", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    mocks.listApplications.mockResolvedValue([record(), record()]);
    mocks.postToDiscord.mockResolvedValue(true);
    const response = await cron("Bearer s3cret");
    expect(await response.json()).toMatchObject({ posted: true, total: 2 });
    expect(mocks.postToDiscord.mock.calls[0][0].embeds[0].title).toMatch(/Daily recap/);
  });
});
