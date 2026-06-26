import { describe, expect, it } from "vitest";
import { snapshotCsvRowSchema } from "./schemas";

describe("snapshotCsvRowSchema", () => {
  it("accepts a valid balance snapshot row", () => {
    const result = snapshotCsvRowSchema.safeParse({
      member_number: "BMPC-0001",
      amount: "10000.00",
      effective_date: "2026-04-24"
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative amounts", () => {
    const result = snapshotCsvRowSchema.safeParse({
      member_number: "BMPC-0001",
      amount: "-1",
      effective_date: "2026-04-24"
    });

    expect(result.success).toBe(false);
  });
});
