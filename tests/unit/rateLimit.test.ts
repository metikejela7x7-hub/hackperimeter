import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/supabase", () => ({ supabaseAdmin: vi.fn() }));
const { clientIp } = await import("@/server/rateLimit");

describe("clientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("http://x", { headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } });
    expect(clientIp(request)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "198.51.100.4" } }))).toBe("198.51.100.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
