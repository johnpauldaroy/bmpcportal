import { PageHeader } from "@/components/page-header";
import { SnapshotSummary } from "@/features/balances/snapshot-summary";
import {
  formatSnapshotDate,
  getLatestMemberSnapshots,
  getLatestSnapshotDate
} from "@/features/balances/snapshot-data";

export default async function BalancesPage() {
  const snapshots = await getLatestMemberSnapshots();
  const latestDate = getLatestSnapshotDate(snapshots);

  return (
    <>
      <PageHeader
        title="Balances"
        description="Savings and share capital are manually imported snapshots, not real-time ledger balances."
        status={`Last updated as of: ${formatSnapshotDate(latestDate)}`}
      />
      <SnapshotSummary snapshots={snapshots} />
    </>
  );
}
