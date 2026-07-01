import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanStatusHistory } from "./data";
import { formatDateTime, loanStatusLabel, loanStatusTone } from "./loan-utils";

export function LoanHistoryList({ history }: { history: LoanStatusHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-[#475569]">No status history yet.</p>;
  }

  return (
    <ol className="grid gap-3">
      {history.map((entry) => (
        <li key={entry.id} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge tone={loanStatusTone(entry.status)}>
              {loanStatusLabel[entry.status]}
            </StatusBadge>
            <span className="text-xs font-medium text-[#475569]">
              {formatDateTime(entry.created_at)}
            </span>
          </div>
          {entry.previous_status ? (
            <p className="mt-2 text-xs text-[#475569]">
              From {loanStatusLabel[entry.previous_status]} to {loanStatusLabel[entry.status]}
            </p>
          ) : null}
          {entry.note ? <p className="mt-2 text-sm leading-6 text-[#334155]">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
