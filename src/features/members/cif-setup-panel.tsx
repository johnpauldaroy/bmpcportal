"use client";

import { Plus, Trash2, ShieldCheck, ShieldOff } from "@/components/ui/icon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Branch = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export type CifRecord = {
  id: string;
  cif_key: string;
  member_number: string;
  branch_id: string;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  branches: { code: string; name: string } | null;
};

type Props = {
  initialBranches: Branch[];
  initialRecords: CifRecord[];
};

export function CifSetupPanel({ initialBranches, initialRecords }: Props) {
  const [branches, setBranches] = useState(initialBranches);
  const [records, setRecords] = useState(initialRecords);
  const [tab, setTab] = useState<"cif" | "branches">("cif");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // CIF form state
  const [cifKey, setCifKey] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [branchId, setBranchId] = useState("");

  // Branch form state
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");

  function notify(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  }

  async function addCifRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!cifKey || !memberNumber || !branchId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cif-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cif_key: cifKey.trim(), member_number: memberNumber.trim().toUpperCase(), branch_id: branchId })
      });
      const payload = await res.json();
      if (!res.ok) { notify(payload.error ?? "Failed to add CIF record.", false); return; }
      setRecords((r) => [payload.records[0], ...r]);
      setCifKey(""); setMemberNumber(""); setBranchId("");
      notify("CIF record added.");
    } finally { setBusy(false); }
  }

  async function deleteCifRecord(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cif-records/${id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) { notify(payload.error ?? "Failed to delete record.", false); return; }
      setRecords((r) => r.filter((x) => x.id !== id));
      notify("CIF record deleted.");
    } finally { setBusy(false); }
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchCode || !branchName) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: branchCode.trim().toUpperCase(), name: branchName.trim() })
      });
      const payload = await res.json();
      if (!res.ok) { notify(payload.error ?? "Failed to add branch.", false); return; }
      setBranches((b) => [...b, payload.branch].sort((a, z) => a.name.localeCompare(z.name)));
      setBranchCode(""); setBranchName("");
      notify("Branch added.");
    } finally { setBusy(false); }
  }

  async function toggleBranch(id: string, is_active: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active })
      });
      const payload = await res.json();
      if (!res.ok) { notify(payload.error ?? "Failed to update branch.", false); return; }
      setBranches((b) => b.map((br) => br.id === id ? payload.branch : br));
      notify(`Branch ${is_active ? "activated" : "deactivated"}.`);
    } finally { setBusy(false); }
  }

  const activeBranches = branches.filter((b) => b.is_active);

  return (
    <div className="grid gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 w-fit">
        {(["cif", "branches"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            {t === "cif" ? "CIF Records" : "Branches"}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.ok ? "text-[#3673FC]" : "text-[#b42318]"}`}>
          {message.text}
        </p>
      )}

      {/* CIF Records tab */}
      {tab === "cif" && (
        <div className="grid gap-6">
          {/* Add form */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
            <h2 className="text-base font-semibold text-[#0F172A] mb-4">Add CIF Record</h2>
            <form onSubmit={addCifRecord} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                CIF Key
                <input
                  className="focus-ring min-h-9 rounded-md border border-[#E2E8F0] px-3 font-mono uppercase tracking-wide"
                  placeholder="e.g. BMPC-2024-00001"
                  value={cifKey}
                  onChange={(e) => setCifKey(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Member Number
                <input
                  className="focus-ring min-h-9 rounded-md border border-[#E2E8F0] px-3 uppercase"
                  placeholder="e.g. MB-00123"
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Branch
                <select
                  className="focus-ring min-h-9 rounded-md border border-[#E2E8F0] px-3 bg-white"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                >
                  <option value="">Select branch</option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" disabled={busy} className="w-full">
                  <Plus aria-hidden size={16} />
                  Add Record
                </Button>
              </div>
            </form>
          </section>

          {/* Records table */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white md-elevation-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0F172A]">CIF Records</h2>
              <span className="text-xs text-[#475569]">{records.length} total · {records.filter(r => r.is_claimed).length} claimed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
                <thead className="bg-[#F1F5F9] text-[#334155]">
                  <tr>
                    <th className="px-4 py-2 font-semibold">CIF Key</th>
                    <th className="px-4 py-2 font-semibold">Member No.</th>
                    <th className="px-4 py-2 font-semibold">Branch</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Added</th>
                    <th className="px-4 py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {records.length > 0 ? records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-2 font-mono text-xs text-[#0F172A]">{rec.cif_key}</td>
                      <td className="px-4 py-2 font-mono text-xs">{rec.member_number}</td>
                      <td className="px-4 py-2 text-xs text-[#475569]">
                        {rec.branches ? `${rec.branches.name} (${rec.branches.code})` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge tone={rec.is_claimed ? "success" : "neutral"}>
                          {rec.is_claimed ? "Claimed" : "Available"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2 text-xs text-[#475569]">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {!rec.is_claimed && (
                          <button
                            onClick={() => deleteCifRecord(rec.id)}
                            disabled={busy}
                            className="text-[#b42318] hover:text-[#7f1e1e] disabled:opacity-40 transition-colors"
                            title="Delete CIF record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-[#475569]" colSpan={6}>
                        No CIF records yet. Add records above so members can register.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Branches tab */}
      {tab === "branches" && (
        <div className="grid gap-6">
          {/* Add form */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
            <h2 className="text-base font-semibold text-[#0F172A] mb-4">Add Branch</h2>
            <form onSubmit={addBranch} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Branch Code
                <input
                  className="focus-ring min-h-9 rounded-md border border-[#E2E8F0] px-3 uppercase font-mono"
                  placeholder="e.g. NORTH"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  maxLength={20}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-[#334155]">
                Branch Name
                <input
                  className="focus-ring min-h-9 rounded-md border border-[#E2E8F0] px-3"
                  placeholder="e.g. North Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  maxLength={80}
                  required
                />
              </label>
              <div className="flex items-end">
                <Button type="submit" disabled={busy} className="w-full">
                  <Plus aria-hidden size={16} />
                  Add Branch
                </Button>
              </div>
            </form>
          </section>

          {/* Branches table */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white md-elevation-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#0F172A]">Branches</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
                <thead className="bg-[#F1F5F9] text-[#334155]">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Code</th>
                    <th className="px-4 py-2 font-semibold">Name</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {branches.length > 0 ? branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-2 font-mono text-xs font-semibold text-[#0F172A]">{branch.code}</td>
                      <td className="px-4 py-2">{branch.name}</td>
                      <td className="px-4 py-2">
                        <StatusBadge tone={branch.is_active ? "success" : "neutral"}>
                          {branch.is_active ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleBranch(branch.id, !branch.is_active)}
                          disabled={busy}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#334155] hover:text-[#3673FC] disabled:opacity-40 transition-colors"
                        >
                          {branch.is_active
                            ? <><ShieldOff size={14} /> Deactivate</>
                            : <><ShieldCheck size={14} /> Activate</>
                          }
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-[#475569]" colSpan={4}>
                        No branches found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
