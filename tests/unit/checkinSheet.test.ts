import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { CHECKED_IN_FORMULA, buildCheckinWorkbook } from "@/server/checkinSheet";
import { record } from "./fixtures";

describe("buildCheckinWorkbook", async () => {
  const file = await buildCheckinWorkbook([
    record({ fullName: "Zed Zulu", teamMode: "team", teamName: "Rocketeers", needs: "Vegan" }),
    record({ fullName: "alice Able" }),
  ]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ArrayBuffer);
  const sheet = workbook.getWorksheet("Check-in")!;

  it("lists teams first, then people looking for a team, with unticked boxes", () => {
    expect(sheet.getRow(1).getCell(7).value).toBe("ID checked");
    expect(sheet.getRow(1).getCell(8).value).toBe("Joined Discord");
    expect(sheet.getRow(2).getCell(1).value).toBe("Zed Zulu");
    expect(sheet.getRow(2).getCell(4).value).toBe("Rocketeers");
    expect(sheet.getRow(2).getCell(6).value).toBe("Vegan");
    expect(sheet.getRow(3).getCell(1).value).toBe("alice Able");
    expect(sheet.getRow(3).getCell(4).value).toBe("Looking for a team");
    expect(sheet.getRow(2).getCell(7).value).toBe(false);
    expect(sheet.getRow(2).getCell(8).value).toBe(false);
  });

  it("leaves spare rows for walk-ins", () => {
    expect(sheet.rowCount).toBe(1 + 2 + 40);
    expect(sheet.getRow(sheet.rowCount).getCell(7).value).toBe(false);
  });

  it("turns a row green when both boxes are ticked", () => {
    // Present at runtime but missing from exceljs's type definitions.
    const [format] = (sheet as unknown as { conditionalFormattings: ExcelJS.ConditionalFormattingOptions[] })
      .conditionalFormattings;
    expect(format.ref).toBe(`A2:I${sheet.rowCount}`);
    expect(format.rules[0]).toMatchObject({ type: "expression", formulae: [CHECKED_IN_FORMULA] });
  });

  it("includes a how-to tab with a live checked-in count", () => {
    const help = workbook.getWorksheet("How to use")!;
    const formulas = help.getColumn(1).values.filter(
      (value) => typeof value === "object" && value !== null && "formula" in value,
    );
    expect(formulas).toHaveLength(1);
  });

  it("keeps teammates together under one team name", async () => {
    const grouped = await buildCheckinWorkbook([
      record({ fullName: "Yara", email: "yara@example.com", teamMode: "team", teamName: "Owls" }),
      record({ fullName: "Bea" }),
      record({
        fullName: "Abe",
        teamMode: "team",
        teamName: "owls",
        teammates: [{ name: "Yara", email: "yara@example.com" }],
      }),
      record({ fullName: "Cal", teamMode: "team", teamName: "Ants" }),
      record({
        fullName: "Dee",
        teamMode: "team",
        teammates: [{ name: "Eve", email: "eve@example.com" }],
      }),
      record({ fullName: "Eve", email: "eve@example.com" }),
    ]);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(grouped as unknown as ArrayBuffer);
    const rows = book.getWorksheet("Check-in")!;
    const listed = [2, 3, 4, 5, 6, 7].map((n) => [rows.getRow(n).getCell(1).value, rows.getRow(n).getCell(4).value]);
    expect(listed).toEqual([
      ["Cal", "Ants"],
      ["Abe", "Owls"],
      ["Yara", "Owls"],
      ["Dee", "Team (no name)"],
      ["Eve", "Team (no name)"],
      ["Bea", "Looking for a team"],
    ]);
  });
});
