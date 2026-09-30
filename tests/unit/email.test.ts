import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptanceEmail, confirmationEmail, escapeHtml } from "@/server/email";

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
});
