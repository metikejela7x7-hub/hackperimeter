import ExcelJS from "exceljs";
import { EXPERIENCE_LEVELS, labelFor } from "@/data/apply";
import { EVENT } from "@/data/event";
import type { ApplicationRecord } from "./applications";

/** Empty rows left at the bottom for walk-ins, formatted like the rest. */
const SPARE_ROWS = 40;

export const CHECKIN_COLUMNS = [
  { header: "Name", key: "name", width: 26 },
  { header: "Email", key: "email", width: 32 },
  { header: "School", key: "school", width: 26 },
  { header: "Team", key: "team", width: 20 },
  { header: "Experience", key: "experience", width: 14 },
  { header: "Dietary / accessibility", key: "needs", width: 30 },
  { header: "ID checked", key: "idChecked", width: 13 },
  { header: "Joined Discord", key: "joinedDiscord", width: 16 },
  { header: "Notes", key: "notes", width: 30 },
] as const;

/** Row turns green once both boxes (columns G and H) are ticked. */
export const CHECKED_IN_FORMULA = "AND($G2=TRUE,$H2=TRUE)";
const GREEN = "FFC6EFCE";

/**
 * Builds the day-of check-in spreadsheet: one row per applicant, two TRUE/FALSE
 * columns that become checkboxes, and conditional formatting that turns a row
 * green when both are ticked.
 */
export async function buildCheckinWorkbook(applications: ApplicationRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = EVENT.name;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Check-in", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = CHECKIN_COLUMNS.map((column) => ({ ...column }));

  const sorted = [...applications].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" }),
  );
  for (const application of sorted) {
    sheet.addRow({
      name: application.fullName,
      email: application.email,
      school: application.school,
      team: application.teamMode === "team" ? (application.teamName ?? "Team (no name)") : "Solo",
      experience: labelFor(EXPERIENCE_LEVELS, application.experience),
      needs: application.needs ?? "",
      idChecked: false,
      joinedDiscord: false,
      notes: "",
    });
  }
  for (let i = 0; i < SPARE_ROWS; i += 1) {
    sheet.addRow({ idChecked: false, joinedDiscord: false });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF121315" } };
  header.height = 22;
  header.alignment = { vertical: "middle" };

  const lastRow = sheet.rowCount;
  for (const key of ["idChecked", "joinedDiscord"] as const) {
    sheet.getColumn(key).alignment = { horizontal: "center" };
  }
  sheet.autoFilter = { from: "A1", to: `I${lastRow}` };
  sheet.addConditionalFormatting({
    ref: `A2:I${lastRow}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [CHECKED_IN_FORMULA],
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: GREEN } } },
      },
    ],
  });

  const help = workbook.addWorksheet("How to use");
  help.getColumn(1).width = 100;
  const lines = [
    `${EVENT.name} check-in (${applications.length} applicants, exported ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET)`,
    "",
    "Turn the TRUE/FALSE cells into checkboxes (one time):",
    "  • Excel: select G2 down to the last row of H, then Insert → Checkbox.",
    "  • Google Sheets: File → Import this file, select the same cells, then Insert → Checkbox.",
    "",
    "At the door: find the person (Ctrl/Cmd+F), check their photo ID, and confirm they joined the Discord.",
    "Tick both boxes and the row turns green. Walk-ins go in the empty rows at the bottom.",
    "",
    "Checked in so far:",
  ];
  lines.forEach((line, index) => {
    help.getCell(index + 1, 1).value = line;
  });
  help.getCell(1, 1).font = { bold: true, size: 13 };
  help.getCell(lines.length + 1, 1).value = {
    formula: "COUNTIFS('Check-in'!G:G,TRUE,'Check-in'!H:H,TRUE)",
  };
  help.getCell(lines.length + 1, 1).alignment = { horizontal: "left" };
  help.getCell(lines.length + 1, 1).font = { bold: true, size: 13 };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
