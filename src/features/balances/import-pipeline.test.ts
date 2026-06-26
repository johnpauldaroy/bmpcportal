import { describe, expect, it } from "vitest";
import { parseSnapshotCsv, validateSnapshotRows } from "./import-pipeline";

describe("parseSnapshotCsv", () => {
  it("reports missing required columns", () => {
    const result = parseSnapshotCsv("member_number,amount\nBMPC-0001,100.00");

    expect(result.errors).toContainEqual({
      field: "effective_date",
      message: "Missing required column: effective_date."
    });
  });
});

describe("validateSnapshotRows", () => {
  it("marks duplicate members and existing snapshots as invalid", () => {
    const parsed = parseSnapshotCsv(
      [
        "member_number,amount,effective_date",
        "BMPC-0001,100.00,2026-04-24",
        "BMPC-0001,200.00,2026-04-24",
        "BMPC-0002,300.00,2026-04-24"
      ].join("\n")
    );

    const result = validateSnapshotRows({
      rows: parsed.rows,
      effectiveDate: "2026-04-24",
      memberIdByNumber: new Map([
        ["BMPC-0001", "member-1"],
        ["BMPC-0002", "member-2"]
      ]),
      existingSnapshotMemberIds: new Set(["member-2"])
    });

    expect(result.summary).toEqual({
      totalRows: 3,
      validRows: 0,
      invalidRows: 3,
      totalAmount: 0
    });
    expect(result.rows[0].errors.some((error) => error.message.includes("more than once"))).toBe(
      true
    );
    expect(result.rows[2].errors).toContainEqual({
      field: "member_number",
      message: "A snapshot already exists for this member, type, and effective date."
    });
  });

  it("accepts clean rows and totals valid amounts", () => {
    const parsed = parseSnapshotCsv(
      [
        "member_number,amount,effective_date",
        "BMPC-0001,100.25,2026-04-24",
        "BMPC-0002,200.50,2026-04-24"
      ].join("\n")
    );

    const result = validateSnapshotRows({
      rows: parsed.rows,
      effectiveDate: "2026-04-24",
      memberIdByNumber: new Map([
        ["BMPC-0001", "member-1"],
        ["BMPC-0002", "member-2"]
      ]),
      existingSnapshotMemberIds: new Set()
    });

    expect(result.summary).toEqual({
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      totalAmount: 300.75
    });
  });
});
