"use client";

import { Upload } from "@/components/ui/icon";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, statusTone } from "@/features/member-records/format";
import type { Database } from "@/types/database";

type KnowledgeDocument = Database["public"]["Tables"]["knowledge_documents"]["Row"];

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as { document: KnowledgeDocument };
}

export function AdminKnowledgePanel({
  documents
}: {
  documents: KnowledgeDocument[];
}) {
  const [rows, setRows] = useState(documents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function uploadDocument() {
    if (!title.trim() || !file) {
      setMessage("Title and document file are required.");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      const response = await fetch("/api/admin/knowledge-documents", {
        method: "POST",
        body: formData
      });
      const payload = await readResponse(response);
      setRows((current) => [payload.document, ...current]);
      setTitle("");
      setDescription("");
      setFile(null);
      setMessage("Knowledge document uploaded and queued for sync.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            Title
            <input
              className="focus-ring min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 px-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            File
            <input
              className="focus-ring min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 px-3 py-2"
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={onFileChange}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-[#334155]">
          Description
          <textarea
            className="focus-ring min-h-24 rounded-md border border-[#E2E8F0] px-3 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        {message ? <p className="text-sm font-medium text-[#334155]">{message}</p> : null}
        <Button className="w-fit" onClick={uploadDocument} disabled={isUploading}>
          <Upload aria-hidden size={18} />
          {isUploading ? "Uploading..." : "Upload document"}
        </Button>
      </section>

      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <h2 className="text-base font-semibold text-[#0F172A]">Knowledge documents</h2>
        <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
            <thead className="bg-[#F1F5F9] text-[#334155]">
              <tr>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rows.length > 0 ? (
                rows.map((document) => (
                  <tr key={document.id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[#0F172A]">{document.title}</p>
                      <p className="text-xs text-[#475569]">{document.description}</p>
                    </td>
                    <td className="px-3 py-2">{document.content_type ?? "Unknown"}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={statusTone(document.sync_status)}>
                        {document.sync_status}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2">{formatDateTime(document.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-[#475569]" colSpan={4}>
                    No knowledge documents uploaded yet.
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
