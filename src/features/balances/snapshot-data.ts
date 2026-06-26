import { createClient } from "@/lib/supabase/server";
import type { SnapshotType } from "@/types/database";

export type MemberSnapshot = {
  type: SnapshotType;
  amount: number;
  effectiveDate: string;
  importedAt: string;
};

export type MemberSnapshotMap = Record<SnapshotType, MemberSnapshot | null>;

export const emptyMemberSnapshots: MemberSnapshotMap = {
  savings: null,
  share_capital: null
};

export async function getLatestMemberSnapshots(): Promise<MemberSnapshotMap> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return emptyMemberSnapshots;
  }

  const { data, error } = await supabase
    .from("member_financial_snapshots")
    .select("type, amount, effective_date, created_at")
    .eq("member_id", user.id)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return emptyMemberSnapshots;
  }

  return data.reduce<MemberSnapshotMap>(
    (snapshots, row) => {
      if (!snapshots[row.type]) {
        snapshots[row.type] = {
          type: row.type,
          amount: Number(row.amount),
          effectiveDate: row.effective_date,
          importedAt: row.created_at
        };
      }

      return snapshots;
    },
    { ...emptyMemberSnapshots }
  );
}

export function getLatestSnapshotDate(snapshots: MemberSnapshotMap) {
  const dates = Object.values(snapshots)
    .map((snapshot) => snapshot?.effectiveDate)
    .filter(Boolean)
    .sort()
    .reverse();

  return dates[0] ?? null;
}

export function formatSnapshotDate(date: string | null) {
  if (!date) {
    return "No approved CSV yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function formatSnapshotAmount(amount: number | null) {
  if (amount === null) {
    return "Pending import";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}
