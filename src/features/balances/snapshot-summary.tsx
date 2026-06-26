import { Landmark, PiggyBank } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatSnapshotAmount,
  formatSnapshotDate,
  type MemberSnapshotMap
} from "./snapshot-data";

const rows = [
  {
    type: "savings" as const,
    label: "Savings",
    icon: PiggyBank
  },
  {
    type: "share_capital" as const,
    label: "Share capital",
    icon: Landmark
  }
];

export function SnapshotSummary({ snapshots }: { snapshots: MemberSnapshotMap }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => {
        const snapshot = snapshots[row.type];

        return (
          <article
            key={row.label}
            className="rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <row.icon className="text-[#136f63]" aria-hidden size={24} />
              <StatusBadge tone={snapshot ? "success" : "warning"}>
                {snapshot ? "Latest snapshot" : "Pending import"}
              </StatusBadge>
            </div>
            <h2 className="mt-5 text-sm font-semibold text-[#5f6c7b]">{row.label}</h2>
            <p className="mt-2 text-2xl font-semibold text-[#10233f]">
              {formatSnapshotAmount(snapshot?.amount ?? null)}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#344456]">
              Last updated as of: {formatSnapshotDate(snapshot?.effectiveDate ?? null)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
