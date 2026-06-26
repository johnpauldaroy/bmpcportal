"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MemberStatus, UserRole } from "@/types/database";

type MemberProfile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string | null;
  role: UserRole;
  status: MemberStatus;
  created_at: string;
};

function statusTone(status: MemberStatus) {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "suspended" || status === "closed") return "danger";
  return "neutral";
}

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as { profile: MemberProfile };
}

export function AdminMemberPanel({ members }: { members: MemberProfile[] }) {
  const [rows, setRows] = useState(members);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(memberId: string, status: MemberStatus) {
    setBusyId(memberId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const payload = await readResponse(response);
      setRows((current) =>
        current.map((row) => (row.id === memberId ? payload.profile : row))
      );
      setMessage(`Member status updated to ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update member.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm">
      {message ? <p className="text-sm font-medium text-[#344456]">{message}</p> : null}
      <div className="overflow-x-auto rounded-md border border-[#e1e8ef]">
        <table className="min-w-full divide-y divide-[#e1e8ef] text-left text-sm">
          <thead className="bg-[#edf3f8] text-[#344456]">
            <tr>
              <th className="px-3 py-2 font-semibold">Member</th>
              <th className="px-3 py-2 font-semibold">Member number</th>
              <th className="px-3 py-2 font-semibold">Contact</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e8ef]">
            {rows.length > 0 ? (
              rows.map((member) => (
                <tr key={member.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-[#10233f]">{member.full_name}</p>
                    <p className="text-xs text-[#5f6c7b]">{member.email}</p>
                  </td>
                  <td className="px-3 py-2">{member.member_number ?? "Not set"}</td>
                  <td className="px-3 py-2">{member.phone ?? "Not set"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={statusTone(member.status)}>{member.status}</StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busyId === member.id || member.status === "active"}
                        onClick={() => updateStatus(member.id, "active")}
                      >
                        <CheckCircle2 aria-hidden size={16} />
                        Activate
                      </Button>
                      <Button
                        disabled={busyId === member.id || member.status === "suspended"}
                        intent="secondary"
                        onClick={() => updateStatus(member.id, "suspended")}
                      >
                        <XCircle aria-hidden size={16} />
                        Suspend
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center text-[#5f6c7b]" colSpan={5}>
                  No member records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
