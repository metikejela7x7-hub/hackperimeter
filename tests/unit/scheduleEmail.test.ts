import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptanceEmail, scheduleEmail } from "@/server/email";

/** Stand-in for the applications table, with just what the schedule send reads and writes. */
const db = vi.hoisted(() => {
  const rows: { id: string; full_name: string; email: string; status: string; schedule_sent_at: string | null }[] =
    [];
  const query = () => {
    let filtered = [...rows];
    const q = {
      select: () => q,
      eq: (column: string, value: string) => {
        if (column === "status") filtered = filtered.filter((r) => r.status === value);
        return q;
      },
      is: () => {
        filtered = filtered.filter((r) => r.schedule_sent_at === null);
        return q;
      },
      order: () => q,
      limit: async (n: number) => ({ data: filtered.slice(0, n), error: null }),
      then: (resolve: (value: unknown) => void) => resolve({ data: filtered, error: null }),
      update: (patch: { schedule_sent_at: string }) => ({
        eq: async (_column: string, id: string) => {
          const row = rows.find((r) => r.id === id);
          if (row) row.schedule_sent_at = patch.schedule_sent_at;
          return { error: null };
        },
      }),
    };
    return q;
  };
  return { rows, client: { from: query } };
});
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/server/supabase", () => ({ supabaseAdmin: () => db.client }));
vi.mock("@/server/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/email")>()),
  sendEmail,
}));

const { sendScheduleBatch, ScheduleEmailNotReady } = await import("@/server/scheduleEmail");

function seed() {
  db.rows.length = 0;
  for (const [i, status] of ["accepted", "accepted", "accepted", "pending"].entries()) {
    db.rows.push({ id: `a${i}`, full_name: `Person ${i}`, email: `p${i}@example.com`, status, schedule_sent_at: null });
  }
}

async function batch() {
  const pending = sendScheduleBatch();
  await vi.runAllTimersAsync();
  return pending;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.stubEnv("EMAIL_FROM", "HackPerimeter <hello@hackperimeter.com>");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackperimeter.com");
  sendEmail.mockReset().mockResolvedValue(true);
  seed();
});

describe("sendScheduleBatch", () => {
  it("emails each accepted applicant once, never pending ones", async () => {
    expect(await batch()).toMatchObject({ sent: 3, remaining: 0, accepted: 3, stopped: false });
    expect(sendEmail.mock.calls.map(([e]) => e.to)).toEqual([
      "p0@example.com",
      "p1@example.com",
      "p2@example.com",
    ]);
    sendEmail.mockClear();
    expect(await batch()).toMatchObject({ sent: 0, remaining: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("stops at a failed send (e.g. Resend's daily limit) and resumes later without repeats", async () => {
    sendEmail.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect(await batch()).toMatchObject({ sent: 1, remaining: 2, stopped: true });

    sendEmail.mockReset().mockResolvedValue(true);
    expect(await batch()).toMatchObject({ sent: 2, remaining: 0, stopped: false });
    expect(sendEmail.mock.calls.map(([e]) => e.to)).toEqual(["p1@example.com", "p2@example.com"]);
  });

  it("won't run without a verified sender", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    await expect(sendScheduleBatch()).rejects.toBeInstanceOf(ScheduleEmailNotReady);
  });
});

describe("schedule email", () => {
  it("counts down, asks people to bring a friend, and attaches the schedule", () => {
    const email = scheduleEmail({ fullName: "Ada Example", email: "ada@example.com" }, 2);
    expect(email.subject).toBe("Only 2 days left until HackPerimeter! Here's your schedule");
    expect(email.text).toContain("We only have 2 days left until HackPerimeter");
    expect(email.text).toContain("Bring a friend! If they haven't applied yet, send them this link: https://hackperimeter.com/apply");
    expect(email.text).toContain("pair you with someone who shares your interests: https://discord.com/invite/MxZrAQRBMP");
    expect(email.text).toContain("https://hackperimeter.com/hackperimeter-participant-agreement.pdf");
    expect(email.attachments).toEqual([
      { filename: "HackPerimeter-Schedule.pdf", path: "https://hackperimeter.com/hackperimeter-schedule.pdf" },
    ]);
    expect(scheduleEmail({ fullName: "Ada", email: "a@example.com" }, 1).subject).toBe(
      "HackPerimeter is tomorrow! Here's your schedule",
    );
  });

  it("is attached to acceptance emails too", () => {
    const email = acceptanceEmail({ fullName: "Ada", email: "a@example.com" });
    expect(email.attachments?.[0].filename).toBe("HackPerimeter-Schedule.pdf");
    expect(email.text).toContain("schedule for the day is attached");
  });
});
