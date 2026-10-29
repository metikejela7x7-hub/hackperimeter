import { afterEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));

const { acceptanceEmail, confirmationEmail, escapeHtml, sendEmail } = await import("@/server/email");

afterEach(() => vi.unstubAllEnvs());

describe("emails", () => {
  it("escapes applicant text in HTML", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;",
    );
    const email = confirmationEmail({ fullName: "<b>Eve</b> Evil", email: "eve@example.com" });
    expect(email.html).not.toContain("<b>Eve</b>");
    expect(email.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
  });

  it("greets by first name", () => {
    expect(confirmationEmail({ fullName: "Ada Lovelace", email: "a@example.com" }).text).toMatch(/^Hi Ada,/);
  });

  it("includes the Discord invite in acceptance emails when configured", () => {
    vi.stubEnv("DISCORD_INVITE_URL", "https://discord.gg/example");
    const email = acceptanceEmail({ fullName: "Ada", email: "a@example.com" });
    expect(email.text).toContain("https://discord.gg/example");
    expect(email.subject).toMatch(/You're in/);
  });

  it("still reads well without a Discord invite", () => {
    vi.stubEnv("DISCORD_INVITE_URL", "");
    expect(acceptanceEmail({ fullName: "Ada", email: "a@example.com" }).text).toContain(
      "We'll send the Discord invite",
    );
  });

  it("still sends the email if the attachment can't be fetched", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockReset();
    send.mockResolvedValueOnce({ error: { message: "could not fetch attachment" } });
    send.mockResolvedValueOnce({ error: null });

    const email = {
      ...acceptanceEmail({ fullName: "Ada", email: "a@example.com" }),
      attachments: [{ filename: "Agenda.pdf", path: "https://hackperimeter.com/agenda.pdf" }],
    };
    expect(await sendEmail(email)).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).not.toHaveProperty("attachments");
  });
});
