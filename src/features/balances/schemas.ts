import { z } from "zod";

export const snapshotTypeSchema = z.enum(["savings", "share_capital"]);

const dateStringSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use YYYY-MM-DD.");

export const snapshotCsvRowSchema = z.object({
  member_number: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative(),
  effective_date: dateStringSchema
});

export const csvImportSchema = z.object({
  type: snapshotTypeSchema,
  effectiveDate: dateStringSchema,
  fileName: z.string().min(1),
  rows: z.array(snapshotCsvRowSchema).min(1)
});

export type CsvImportInput = z.infer<typeof csvImportSchema>;
