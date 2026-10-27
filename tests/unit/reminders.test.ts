import { beforeEach, describe, expect, it, vi } from "vitest";
import { googleCalendarUrl, icsFile, outlookCalendarUrl } from "@/data/calendar";
import { EVENT } from "@/data/event";
import { weeklyReminderEmail } from "@/server/email";
import { record } from "./fixtures";

const sent = vi.hoisted(() => ({ weeks: new Set<number>(), missing: false }));
const mocks = vi.hoisted(() => ({ sendEmails: vi.fn(), listApplications: vi.fn() }));

vi.mock("@/server/supabase", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      upsert: (row: { weeks_left: number }) => ({
        select: async () => {
          if (sent.missing) return { data: null, error: { code: "PGRST205" } };
          if (sent.weeks.has(row.weeks_left)) return { data: [], error: null };
          sent.weeks.add(row.weeks_left);
          return { data: [row], error: null };
        },
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));
vi.mock("@/server/applications", () => ({ listApplications: mocks.listApplications }));
vi.mock("@/server/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/email")>()),
  sendEmails: mocks.sendEmails,
}));

const { reminderWeeksLeft, sendWeeklyReminders } = await import("@/server/reminders");

const DAY = 24 * 60 * 60 * 1000;
/** 9 AM Eastern, `days` days before the event day (the cron's run time). */
const daysBefore = (days: number) => new Date(EVENT.startsAt + 60 * 60 * 1000 - days * DAY);

beforeEach(() => {
  sent.weeks.clear();
  sent.missing = false;
  mocks.sendEmails.mockReset().mockImplementation(async (emails: unknown[]) => emails.length);
  mocks.listApplications.mockResolvedValue([
    record({ fullName: "Acc One", status: "accepted" }),
    record({ fullName: "Acc Two", status: "accepted" }),
    record({ fullName: "Pending", status: "pending" }),
    record({ fullName: "Rejected", status: "rejected" }),
  ]);
});

describe("reminderWeeksLeft", () => {
  it("is the number of weeks on the event's weekday, and null on other days", () => {
    expect(reminderWeeksLeft(daysBefore(28))).toBe(4);
    expect(reminderWeeksLeft(daysBefore(7))).toBe(1);
    expect(reminderWeeksLeft(daysBefore(8))).toBeNull();
    expect(reminderWeeksLeft(daysBefore(1))).toBeNull();
    expect(reminderWeeksLeft(daysBefore(0))).toBeNull();
    expect(reminderWeeksLeft(daysBefore(-7))).toBeNull();
  });
});

describe("sendWeeklyReminders", () => {
  it("emails accepted applicants only, once per week", async () => {
    expect(await sendWeeklyReminders(daysBefore(14))).toBe(2);
    const [emails] = mocks.sendEmails.mock.calls[0];
    expect(emails.map((e: { subject: string }) => e.subject)).toEqual([
      "2 weeks to go: HackPerimeter is November 13, 2026",
      "2 weeks to go: HackPerimeter is November 13, 2026",
    ]);
    expect(await sendWeeklyReminders(daysBefore(14))).toBe(0); // retried job
    expect(mocks.sendEmails).toHaveBeenCalledTimes(1);
  });

  it("does nothing on other days, or before the table exists", async () => {
    expect(await sendWeeklyReminders(daysBefore(10))).toBe(0);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    sent.missing = true;
    expect(await sendWeeklyReminders(daysBefore(7))).toBe(0);
    expect(mocks.sendEmails).not.toHaveBeenCalled();
  });
});

describe("weeklyReminderEmail", () => {
  it("counts down and links every calendar", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackperimeter.com");
    const email = weeklyReminderEmail({ fullName: "Ada Example", email: "ada@example.com" }, 1);
    expect(email.subject).toBe("One week to go: HackPerimeter is November 13, 2026");
    expect(email.text).toContain("calendar.google.com");
    expect(email.text).toContain("outlook.live.com");
    expect(email.text).toContain("https://hackperimeter.com/api/calendar");
  });
});

describe("calendar links", () => {
  it("pre-fill the event's real start and end times", () => {
    const google = new URL(googleCalendarUrl("https://hackperimeter.com"));
    expect(google.searchParams.get("dates")).toBe("20261113T130000Z/20261114T013000Z");
    expect(google.searchParams.get("location")).toContain("Clarkston, GA");
    const outlook = new URL(outlookCalendarUrl("https://hackperimeter.com"));
    expect(outlook.searchParams.get("startdt")).toBe("2026-11-13T13:00:00.000Z");
  });

  it("builds a valid .ics file", () => {
    const ics = icsFile("https://hackperimeter.com", new Date("2026-10-13T00:00:00Z"));
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261113T130000Z");
    expect(ics).toContain("LOCATION:CL Jim Cherry Auditorium\\, 555 Indian Creek Drive\\, Clarkston\\, GA");
    expect(lines.every((line) => line.length <= 75)).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
