import { describe, expect, it } from "vitest";
import { looksLikeSchoolEmail } from "@/components/ApplyForm/validation";

describe("looksLikeSchoolEmail", () => {
  it.each(["ada@gsu.edu", "ada@student.gsu.edu", "Ada@GSU.EDU ", "ada@uni.edu.au", "ada@ox.ac.uk"])(
    "flags %s",
    (email) => expect(looksLikeSchoolEmail(email)).toBe(true),
  );

  it.each(["ada@gmail.com", "ada@education.com", "ada@edu.example.com", "not-an-email"])(
    "leaves %s alone",
    (email) => expect(looksLikeSchoolEmail(email)).toBe(false),
  );
});
