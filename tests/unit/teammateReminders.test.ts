import { beforeEach, describe, expect, it, vi } from "vitest";
import { record } from "./fixtures";

/** Stand-in for the teammate_invites table. */
const db = vi.hoisted(() => {
  const rows = new Map<string, { id: string; email: string; reminded_at: string | null }>();
  const table = {
    select: () => ({
      in: async (_column: string, emails: string[]) => ({
        data: emails.flatMap((e) => (rows.has(e) ? [rows.get(e)] : [])),
        error: null,
      }),
    }),
    upsert: (row: { email: string }) => ({
      select: async () => {
        if (rows.has(row.email)) return { data: [], error: null };
        const created = { id: `invite-${row.email}`, email: row.email, reminded_at: null };
        rows.set(row.email, created);
        return { data: [{ id: created.id }], error: null };
      },
    }),
    update: (patch: { reminded_at: string }) => ({
      eq: async (_column: string, id: string) => {
        for (const row of rows.values()) if (row.id === id) row.reminded_at = patch.reminded_at;
        return { error: null };
      },
    }),
    delete: () => ({
      eq: async (_column: string, id: string) => {
        for (const [email, row] of rows) if (row.id === id) rows.delete(email);
        return { error: null };
      },
    }),
  };
  return { rows, client: { from: () => table } };
});
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/server/supabase", () => ({ supabaseAdmin: () => db.client }));
vi.mock("@/server/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/email")>()),
  sendEmail,
}));

const { remindListedTeammates, RemindersNotReady } = await import("@/server/invites");

const team = () => [
  record({
    fullName: "Ada Example",
    teamMode: "team",
    teamName: "Byte Me",
    teammates: [
      { name: "Grace", email: "grace@example.com" },
      { name: "Linus", email: "Linus@example.com" },
    ],
  }),
  // Two teams listing the same person: still only one email.
  record({
    fullName: "Kai Example",
    teamMode: "team",
    teamName: "Owls",
    teammates: [{ name: "Grace", email: "grace@example.com" }],
  }),
];

const subjects = () => sendEmail.mock.calls.map(([email]) => `${email.to}: ${email.subject}`);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.stubEnv("EMAIL_FROM", "HackPerimeter <hello@hackperimeter.com>");
  sendEmail.mockReset().mockResolvedValue(true);
  db.rows.clear();
});

async function run(applications = team()) {
  const pending = remindListedTeammates(applications);
  await vi.runAllTimersAsync();
  return pending;
}

describe("remindListedTeammates", () => {
  it("invites people who were never invited, and reminds the rest once", async () => {
    db.rows.set("grace@example.com", { id: "g", email: "grace@example.com", reminded_at: null });

    expect(await run()).toEqual({ invited: 1, reminded: 1, skipped: 0 });
    expect(subjects().sort()).toEqual([
      "grace@example.com: Reminder: Ada Example is saving you a spot at HackPerimeter",
      "linus@example.com: Ada Example listed you as a teammate for HackPerimeter",
    ]);
  });

  it("never emails anyone a second reminder", async () => {
    db.rows.set("grace@example.com", { id: "g", email: "grace@example.com", reminded_at: null });
    await run();
    sendEmail.mockClear();

    // Linus now has an invite and Grace has been reminded.
    expect(await run()).toEqual({ invited: 0, reminded: 1, skipped: 1 });
    expect(subjects()).toEqual([
      "linus@example.com: Reminder: Ada Example is saving you a spot at HackPerimeter",
    ]);
    sendEmail.mockClear();
    expect(await run()).toEqual({ invited: 0, reminded: 0, skipped: 2 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reminds one person on request, and again only when the organizer asks", async () => {
    db.rows.set("grace@example.com", {
      id: "g",
      email: "grace@example.com",
      reminded_at: "2026-10-20T12:00:00Z",
    });
    const one = (again = false) => {
      const pending = remindListedTeammates(team(), "Grace@Example.com", again);
      return vi.runAllTimersAsync().then(() => pending);
    };
    expect(await one()).toEqual({ invited: 0, reminded: 0, skipped: 1 });
    expect(await one(true)).toEqual({ invited: 0, reminded: 1, skipped: 0 });
    expect(subjects()).toEqual([
      "grace@example.com: Reminder: Ada Example is saving you a spot at HackPerimeter",
    ]);
  });

  it("refuses to run without a verified sender", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    await expect(remindListedTeammates(team())).rejects.toBeInstanceOf(RemindersNotReady);
  });
});
