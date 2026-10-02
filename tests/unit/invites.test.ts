import { beforeEach, describe, expect, it, vi } from "vitest";
import { teammateInviteEmail } from "@/server/email";
import { record } from "./fixtures";

/** A tiny stand-in for the two Supabase queries the invite code makes. */
const db = vi.hoisted(() => {
  const state = {
    applied: new Set<string>(),
    invited: new Map<string, string>(),
    missingTable: false,
  };
  const from = (table: string) => {
    if (table === "applications") {
      let email = "";
      const query = {
        select: () => query,
        ilike: (_column: string, value: string) => {
          email = value.replace(/\\(.)/g, "$1");
          return query;
        },
        limit: async () => ({ data: state.applied.has(email) ? [{ id: "x" }] : [], error: null }),
      };
      return query;
    }
    return {
      upsert: (row: { email: string }) => ({
        select: async () => {
          if (state.missingTable) return { data: null, error: { code: "PGRST205" } };
          if (state.invited.has(row.email)) return { data: [], error: null };
          const id = `invite-${row.email}`;
          state.invited.set(row.email, id);
          return { data: [{ id }], error: null };
        },
      }),
      delete: () => ({
        eq: async (_column: string, id: string) => {
          for (const [email, value] of state.invited) if (value === id) state.invited.delete(email);
          return { error: null };
        },
      }),
    };
  };
  return { state, client: { from } };
});

const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/server/supabase", () => ({ supabaseAdmin: () => db.client }));
vi.mock("@/server/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/email")>()),
  sendEmail,
}));

const { sendTeammateInvites } = await import("@/server/invites");

const ada = (overrides = {}) =>
  record({
    fullName: "Ada Example",
    email: "ada@example.com",
    teamMode: "team",
    teamName: "Byte Me",
    teammates: [
      { name: "Grace", email: "Grace@Example.com" },
      { name: "Linus", email: "linus@example.com" },
    ],
    ...overrides,
  });

const recipients = () => sendEmail.mock.calls.map(([email]) => email.to);

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("EMAIL_FROM", "HackPerimeter <hello@hackperimeter.com>");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackperimeter.com");
  sendEmail.mockReset().mockResolvedValue(true);
  db.state.applied.clear();
  db.state.invited.clear();
  db.state.missingTable = false;
});

describe("sendTeammateInvites", () => {
  it("invites each listed teammate once, with a link that pre-fills the form", async () => {
    await sendTeammateInvites(ada());

    expect(recipients()).toEqual(["grace@example.com", "linus@example.com"]);
    const [invite] = sendEmail.mock.calls[0];
    expect(invite.subject).toBe("Ada Example listed you as a teammate for HackPerimeter");
    expect(invite.text).toContain("https://hackperimeter.com/apply?invite=invite-grace@example.com");
  });

  it("never invites the same address twice, whoever lists it", async () => {
    await sendTeammateInvites(ada());
    await sendTeammateInvites(
      ada({ id: "00000000-0000-4000-8000-999999999999", email: "kai@example.com" }),
    );
    expect(recipients()).toEqual(["grace@example.com", "linus@example.com"]);
  });

  it("skips teammates who already applied, and the applicant's own email", async () => {
    db.state.applied.add("grace@example.com");
    await sendTeammateInvites(
      ada({
        teammates: [
          { name: "Grace", email: "grace@example.com" },
          { name: "Me", email: "ADA@example.com" },
        ],
      }),
    );
    expect(recipients()).toEqual([]);
  });

  it("sends nothing without a verified sender or for people looking for a team", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    await sendTeammateInvites(ada());
    vi.stubEnv("EMAIL_FROM", "HackPerimeter <hello@hackperimeter.com>");
    await sendTeammateInvites(ada({ teamMode: "solo" }));
    expect(recipients()).toEqual([]);
  });

  it("lets a failed send be retried later", async () => {
    sendEmail.mockResolvedValueOnce(false);
    await sendTeammateInvites(ada());
    expect(db.state.invited.has("grace@example.com")).toBe(false);
    expect(db.state.invited.has("linus@example.com")).toBe(true);
  });

  it("does nothing (and doesn't throw) before the invites table exists", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    db.state.missingTable = true;
    await expect(sendTeammateInvites(ada())).resolves.toBeUndefined();
    expect(recipients()).toEqual([]);
  });
});

describe("teammateInviteEmail", () => {
  it("escapes what the applicant typed", () => {
    const email = teammateInviteEmail({
      to: "grace@example.com",
      inviterName: "<b>Ada</b>",
      teamName: "<script>",
      link: "https://hackperimeter.com/apply?invite=abc",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
    expect(email.text).toContain("ignore this email");
  });
});
