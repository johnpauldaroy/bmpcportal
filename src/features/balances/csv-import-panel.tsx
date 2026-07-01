"use client";

import { CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload, XCircle } from "@/components/ui/icon";
import { useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SnapshotType } from "@/types/database";
import type {
  SnapshotImportSummary,
  ValidatedSnapshotCsvRow
} from "./import-pipeline";

type ImportBatch = {
  id: string;
  type: SnapshotType;
  effective_date: string;
  status: string;
  source_file_name: string | null;
  row_count: number;
  valid_row_count: number;
  invalid_row_count: number;
  total_amount: number | string;
  committed_at: string | null;
  created_at: string;
  error_summary?: unknown;
};

type PreviewState = {
  import: ImportBatch;
  summary: SnapshotImportSummary;
  previewRows: ValidatedSnapshotCsvRow[];
};

const snapshotTypeLabel: Record<SnapshotType, string> = {
  savings: "Savings",
  share_capital: "Share capital"
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadTemplate(type: SnapshotType, effectiveDate: string) {
  const label = type === "savings" ? "savings" : "share_capital";
  const rows = [
    ["member_number", "amount", "effective_date"],
    ["BMPC-0001", "5000.00", effectiveDate],
    ["BMPC-0002", "12500.00", effectiveDate],
    ["BMPC-0003", "3750.50", effectiveDate],
    // empty row as placeholder
    ["BMPC-XXXX", "0.00", effectiveDate]
  ];
  const csv = rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bmpc_${label}_template_${effectiveDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatMoney(value: number | string) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatStatusTone(status: string) {
  if (status === "committed") return "success";
  if (status === "failed" || status === "cancelled") return "danger";
  if (status === "previewed") return "warning";
  return "neutral";
}

async function readJsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload;
}

export function CsvImportPanel({ initialImports = [] }: { initialImports?: ImportBatch[] }) {
  const [type, setType] = useState<SnapshotType>("savings");
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [imports, setImports] = useState<ImportBatch[]>(initialImports);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canCommit = useMemo(
    () => Boolean(preview && preview.summary.invalidRows === 0 && preview.summary.validRows > 0),
    [preview]
  );

  async function loadImports() {
    const response = await fetch("/api/admin/imports", { cache: "no-store" });
    const payload = await readJsonResponse(response);
    setImports(payload.imports ?? []);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setMessage(null);
  }

  async function uploadForPreview() {
    if (!selectedFile) {
      setMessage("Choose a CSV file first.");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("effectiveDate", effectiveDate);
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/imports", {
        method: "POST",
        body: formData
      });
      const payload = await readJsonResponse(response);

      setPreview(payload);
      setMessage("Preview staged. Review validation before committing.");
      await loadImports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function commitImport() {
    if (!preview) {
      return;
    }

    setIsCommitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/imports/${preview.import.id}/commit`, {
        method: "POST"
      });
      const payload = await readJsonResponse(response);

      if (payload.ok === false) {
        throw new Error(payload.error ?? "Commit failed.");
      }

      setMessage(`Committed ${payload.inserted_count ?? preview.summary.validRows} snapshots.`);
      setPreview(null);
      setSelectedFile(null);
      await loadImports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Commit failed.");
      await loadImports().catch(() => undefined);
    } finally {
      setIsCommitting(false);
    }
  }

  async function cancelPreview() {
    if (!preview) {
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/admin/imports/${preview.import.id}/cancel`, {
        method: "POST"
      });
      await readJsonResponse(response);
      setPreview(null);
      setMessage("Preview batch cancelled.");
      await loadImports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cancel failed.");
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-[#334155]">
              Snapshot type
              <select
                className="min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 bg-white px-3 text-sm text-[#1E293B]"
                value={type}
                onChange={(event) => setType(event.target.value as SnapshotType)}
              >
                <option value="savings">Savings</option>
                <option value="share_capital">Share capital</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#334155]">
              Effective date
              <input
                className="min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 bg-white px-3 text-sm text-[#1E293B]"
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#334155]">
              CSV file
              <input
                className="min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 bg-white px-3 py-2 text-sm text-[#1E293B]"
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
              />
            </label>
          </div>

          <Button onClick={uploadForPreview} disabled={isUploading || !selectedFile}>
            <Upload aria-hidden size={18} />
            {isUploading ? "Uploading..." : "Upload preview"}
          </Button>
        </div>

        {message ? (
          <p className={`text-sm font-medium ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("error") ? "text-[#b42318]" : "text-[#1F52F1]"}`}>
            {message}
          </p>
        ) : null}

        {/* Template info + download */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: "#DAE7FF", color: "#3673FC" }}>
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">CSV Format Requirements</p>
              <p className="mt-0.5 text-xs leading-5 text-[#475569]">
                Required columns: <code className="rounded bg-[#F1F5F9] px-1 py-0.5 font-mono text-[#3673FC]">member_number</code>,{" "}
                <code className="rounded bg-[#F1F5F9] px-1 py-0.5 font-mono text-[#3673FC]">amount</code>,{" "}
                <code className="rounded bg-[#F1F5F9] px-1 py-0.5 font-mono text-[#3673FC]">effective_date</code>.
                All row dates must match the selected effective date.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadTemplate(type, effectiveDate)}
            className="flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{ borderColor: "#3673FC", color: "#3673FC", background: "white" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#DAE7FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "white";
            }}
          >
            <Download size={15} />
            Download Template
          </button>
        </div>
      </section>

      {preview ? (
        <section className="grid gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">Import preview</h2>
              <p className="mt-1 text-sm text-[#475569]">
                {snapshotTypeLabel[preview.import.type]} for {preview.import.effective_date}
              </p>
            </div>
            <StatusBadge tone={formatStatusTone(preview.import.status)}>
              {preview.import.status}
            </StatusBadge>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge>Total rows: {preview.summary.totalRows}</StatusBadge>
            <StatusBadge tone="success">Valid: {preview.summary.validRows}</StatusBadge>
            <StatusBadge tone={preview.summary.invalidRows > 0 ? "danger" : "neutral"}>
              Invalid: {preview.summary.invalidRows}
            </StatusBadge>
            <StatusBadge>Total: {formatMoney(preview.summary.totalAmount)}</StatusBadge>
          </div>

          <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
              <thead className="bg-[#F1F5F9] text-[#334155]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Row</th>
                  <th className="px-3 py-2 font-semibold">Member number</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Effective date</th>
                  <th className="px-3 py-2 font-semibold">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {preview.previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.memberNumber ?? row.raw.member_number}</td>
                    <td className="px-3 py-2">{row.amount ?? row.raw.amount}</td>
                    <td className="px-3 py-2">
                      {row.effectiveDate ?? row.raw.effective_date}
                    </td>
                    <td className="px-3 py-2">
                      {row.status === "valid" ? (
                        <StatusBadge tone="success">Valid</StatusBadge>
                      ) : (
                        <div className="grid gap-1">
                          <StatusBadge tone="danger">Invalid</StatusBadge>
                          <span className="text-xs text-[#8f1f16]">
                            {row.errors.map((error) => error.message).join(" ")}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={commitImport} disabled={!canCommit || isCommitting}>
              <CheckCircle2 aria-hidden size={18} />
              {isCommitting ? "Committing..." : "Commit import"}
            </Button>
            <Button intent="secondary" onClick={cancelPreview}>
              <XCircle aria-hidden size={18} />
              Cancel preview
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#0F172A]">Batch log</h2>
          <Button intent="secondary" onClick={() => loadImports()}>
            <RotateCcw aria-hidden size={18} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
            <thead className="bg-[#F1F5F9] text-[#334155]">
              <tr>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Effective date</th>
                <th className="px-3 py-2 font-semibold">Rows</th>
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {imports.length > 0 ? (
                imports.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{snapshotTypeLabel[item.type]}</td>
                    <td className="px-3 py-2">{item.effective_date}</td>
                    <td className="px-3 py-2">
                      {item.valid_row_count}/{item.row_count}
                    </td>
                    <td className="px-3 py-2">{formatMoney(item.total_amount)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={formatStatusTone(item.status)}>
                        {item.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-[#475569]" colSpan={6}>
                    No import batches logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
