import Papa from "papaparse";
import { snapshotCsvRowSchema, snapshotTypeSchema } from "./schemas";

export const REQUIRED_SNAPSHOT_COLUMNS = [
  "member_number",
  "amount",
  "effective_date"
] as const;

export type SnapshotImportRowStatus = "valid" | "invalid" | "committed" | "skipped";

export type RawSnapshotCsvRow = {
  member_number?: string;
  amount?: string;
  effective_date?: string;
  [key: string]: string | undefined;
};

export type RowIssue = {
  field: string;
  message: string;
};

export type ParsedSnapshotCsvRow = {
  rowNumber: number;
  raw: RawSnapshotCsvRow;
};

export type ValidatedSnapshotCsvRow = {
  rowNumber: number;
  memberNumber: string | null;
  memberId: string | null;
  amount: number | null;
  effectiveDate: string | null;
  raw: RawSnapshotCsvRow;
  status: Extract<SnapshotImportRowStatus, "valid" | "invalid">;
  errors: RowIssue[];
};

export type SnapshotImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalAmount: number;
};

export type ParseSnapshotCsvResult = {
  rows: ParsedSnapshotCsvRow[];
  fields: string[];
  errors: RowIssue[];
};

export function normalizeMemberNumber(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeSnapshotType(value: unknown) {
  return snapshotTypeSchema.parse(value);
}

export function parseSnapshotCsv(csvText: string): ParseSnapshotCsvResult {
  const result = Papa.parse<RawSnapshotCsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });

  const fields = result.meta.fields ?? [];
  const missingColumns = REQUIRED_SNAPSHOT_COLUMNS.filter(
    (column) => !fields.includes(column)
  );
  const errors: RowIssue[] = [
    ...missingColumns.map((column) => ({
      field: column,
      message: `Missing required column: ${column}.`
    })),
    ...result.errors.map((error) => ({
      field: "csv",
      message: `Row ${error.row ?? "unknown"}: ${error.message}`
    }))
  ];

  return {
    fields,
    errors,
    rows: result.data.map((raw, index) => ({
      rowNumber: index + 2,
      raw
    }))
  };
}

export function validateSnapshotRows(input: {
  rows: ParsedSnapshotCsvRow[];
  effectiveDate: string;
  memberIdByNumber: Map<string, string>;
  existingSnapshotMemberIds: Set<string>;
}) {
  const memberOccurrences = new Map<string, number>();

  for (const row of input.rows) {
    const memberNumber = normalizeMemberNumber(row.raw.member_number);
    if (memberNumber) {
      memberOccurrences.set(memberNumber, (memberOccurrences.get(memberNumber) ?? 0) + 1);
    }
  }

  const validatedRows: ValidatedSnapshotCsvRow[] = input.rows.map((row) => {
    const parsed = snapshotCsvRowSchema.safeParse(row.raw);
    const errors: RowIssue[] = [];
    const memberNumber = normalizeMemberNumber(row.raw.member_number);
    let amount: number | null = null;
    let effectiveDate: string | null = null;

    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "row",
          message: issue.message
        }))
      );
    } else {
      amount = parsed.data.amount;
      effectiveDate = parsed.data.effective_date;

      if (parsed.data.effective_date !== input.effectiveDate) {
        errors.push({
          field: "effective_date",
          message: `Row date must match batch effective date ${input.effectiveDate}.`
        });
      }
    }

    const memberId = memberNumber ? input.memberIdByNumber.get(memberNumber) ?? null : null;

    if (memberNumber && !memberId) {
      errors.push({
        field: "member_number",
        message: "Member number was not found."
      });
    }

    if (memberNumber && (memberOccurrences.get(memberNumber) ?? 0) > 1) {
      errors.push({
        field: "member_number",
        message: "Member appears more than once in this batch."
      });
    }

    if (memberId && input.existingSnapshotMemberIds.has(memberId)) {
      errors.push({
        field: "member_number",
        message: "A snapshot already exists for this member, type, and effective date."
      });
    }

    return {
      rowNumber: row.rowNumber,
      memberNumber: memberNumber || null,
      memberId,
      amount,
      effectiveDate,
      raw: row.raw,
      status: errors.length > 0 ? "invalid" : "valid",
      errors
    };
  });

  return {
    rows: validatedRows,
    summary: summarizeValidatedRows(validatedRows)
  };
}

export function summarizeValidatedRows(
  rows: Pick<ValidatedSnapshotCsvRow, "status" | "amount">[]
): SnapshotImportSummary {
  const validRows = rows.filter((row) => row.status === "valid");

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: rows.length - validRows.length,
    totalAmount: Number(
      validRows.reduce((sum, row) => sum + (row.amount ?? 0), 0).toFixed(2)
    )
  };
}
