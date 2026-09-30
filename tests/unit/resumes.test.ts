import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/supabase", () => ({ RESUME_BUCKET: "resumes", supabaseAdmin: vi.fn() }));
const { checkResume } = await import("@/server/resumes");

const pdf = (size: number) => {
  const bytes = new Uint8Array(size);
  bytes.set(new TextEncoder().encode("%PDF-1.7"));
  return bytes;
};

describe("checkResume", () => {
  it("accepts a real PDF", () => {
    expect(checkResume(pdf(2048))).toEqual({ ok: true });
  });

  it("rejects empty files", () => {
    expect(checkResume(new Uint8Array())).toMatchObject({ ok: false });
  });

  it("rejects files over 4 MB", () => {
    expect(checkResume(pdf(4 * 1024 * 1024 + 1))).toMatchObject({ ok: false });
  });

  it("rejects non-PDF bytes even when named .pdf", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(checkResume(png)).toMatchObject({ ok: false, message: expect.stringMatching(/PDF/) });
  });
});
