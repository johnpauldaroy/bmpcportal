import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, statusTone } from "@/features/member-records/format";
import { createClient } from "@/lib/supabase/server";

export default async function PointsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: ledger }, { data: rewards }, { data: redemptions }] = user
    ? await Promise.all([
        supabase
          .from("points_ledger")
          .select("*")
          .eq("member_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("rewards_catalog")
          .select("*")
          .eq("is_active", true)
          .order("points_cost", { ascending: true }),
        supabase
          .from("reward_redemptions")
          .select("*")
          .eq("member_id", user.id)
          .order("requested_at", { ascending: false })
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const balance =
    ledger && ledger.length > 0
      ? ledger.find((entry) => entry.balance_after !== null)?.balance_after
      : null;

  return (
    <>
      <PageHeader
        title="Loyalty points"
        description="Review ledger-based point transactions, rewards, and redemption history."
        status={`Current balance: ${balance ?? 0} points`}
      />
      <div className="grid gap-6">
        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Point ledger</h2>
          {ledger && ledger.length > 0 ? (
            ledger.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 md-elevation-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone={entry.points > 0 ? "success" : "warning"}>
                      {entry.entry_type}
                    </StatusBadge>
                    <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
                      {entry.reason}
                    </h3>
                    <p className="mt-1 text-sm text-[#475569]">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {entry.points > 0 ? "+" : ""}
                      {entry.points}
                    </p>
                    <p className="text-xs text-[#475569]">
                      Balance after: {entry.balance_after ?? "Not set"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No point transactions yet"
              text="Point activity will be recorded in an immutable ledger."
            />
          )}
        </section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Available rewards</h2>
          {rewards && rewards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rewards.map((reward) => (
                <article
                  key={reward.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 md-elevation-1"
                >
                  <h3 className="text-base font-semibold text-[#0F172A]">{reward.name}</h3>
                  <p className="mt-1 text-sm text-[#475569]">
                    {reward.description ?? "No description provided."}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#3673FC]">
                    {reward.points_cost} points
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No rewards available"
              text="Active rewards will appear here when the cooperative publishes them."
            />
          )}
        </section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Redemptions</h2>
          {redemptions && redemptions.length > 0 ? (
            redemptions.map((redemption) => (
              <article
                key={redemption.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 md-elevation-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {redemption.redemption_number}
                    </h3>
                    <p className="mt-1 text-sm text-[#475569]">
                      Requested {formatDateTime(redemption.requested_at)}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone(redemption.status)}>
                    {redemption.status}
                  </StatusBadge>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No redemptions yet"
              text="Reward redemption requests will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
