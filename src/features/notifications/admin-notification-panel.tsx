"use client";

import { Send } from "@/components/ui/icon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, statusTone } from "@/features/member-records/format";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  member?: {
    full_name: string;
    member_number: string | null;
  } | null;
};

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as { notification: Notification };
}

export function AdminNotificationPanel({
  notifications
}: {
  notifications: Notification[];
}) {
  const [rows, setRows] = useState(notifications);
  const [memberNumber, setMemberNumber] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function createNotification() {
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ memberNumber, title, body })
      });
      const payload = await readResponse(response);
      setRows((current) => [payload.notification, ...current]);
      setMemberNumber("");
      setTitle("");
      setBody("");
      setMessage("Notification queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to queue notification.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            Member number
            <input
              className="focus-ring min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 px-3"
              value={memberNumber}
              onChange={(event) => setMemberNumber(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            Title
            <input
              className="focus-ring min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 px-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-[#334155]">
          Message
          <textarea
            className="focus-ring min-h-24 rounded-md border border-[#E2E8F0] px-3 py-2"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        {message ? <p className="text-sm font-medium text-[#334155]">{message}</p> : null}
        <Button className="w-fit" onClick={createNotification} disabled={isSending}>
          <Send aria-hidden size={18} />
          {isSending ? "Queueing..." : "Queue notification"}
        </Button>
      </section>

      <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <h2 className="text-base font-semibold text-[#0F172A]">Recent notifications</h2>
        <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
            <thead className="bg-[#F1F5F9] text-[#334155]">
              <tr>
                <th className="px-3 py-2 font-semibold">Recipient</th>
                <th className="px-3 py-2 font-semibold">Message</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rows.length > 0 ? (
                rows.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[#0F172A]">
                        {notification.member?.full_name ?? "Member"}
                      </p>
                      <p className="text-xs text-[#475569]">
                        {notification.member?.member_number ?? notification.member_id}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[#0F172A]">{notification.title}</p>
                      <p className="text-xs text-[#475569]">{notification.body}</p>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={statusTone(notification.status)}>
                        {notification.status}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2">{formatDateTime(notification.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-[#475569]" colSpan={4}>
                    No notifications queued yet.
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
