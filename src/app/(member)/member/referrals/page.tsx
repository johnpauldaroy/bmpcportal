import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, statusTone } from "@/features/member-records/format";
import { createClient } from "@/lib/supabase/server";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: memberProfile }, { data: referrals }] = user
    ? await Promise.all([
        supabase
          .from("member_profiles")
          .select("*")
          .eq("member_id", user.id)
          .maybeSingle(),
        supabase
          .from("referrals")
          .select("*")
          .eq("referrer_member_id", user.id)
          .order("created_at", { ascending: false })
      ])
    : [{ data: null }, { data: [] }];

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Share referral codes and track verification status for reward points."
      />
      <div className="grid gap-6">
        <section className="rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#136f63]">
            Your referral code
          </p>
          <p className="mt-3 w-fit rounded-lg border border-dashed border-[#cbd7e3] bg-[#f8fafc] px-4 py-3 font-mono text-2xl font-semibold text-[#10233f]">
            {memberProfile?.referral_code ?? "Pending"}
          </p>
          <p className="mt-3 text-sm text-[#5f6c7b]">
            Share this code with prospective BMPC members. Staff verification controls
            reward eligibility.
          </p>
        </section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#10233f]">Referral history</h2>
          {referrals && referrals.length > 0 ? (
            referrals.map((referral) => (
              <article
                key={referral.id}
                className="rounded-lg border border-[#d8e1ea] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#10233f]">
                      {referral.invited_name ?? "Invited member"}
                    </h3>
                    <p className="mt-1 text-sm text-[#5f6c7b]">
                      Created {formatDateTime(referral.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-[#5f6c7b]">
                      Reward points: {referral.reward_points_awarded}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone(referral.status)}>
                    {referral.status}
                  </StatusBadge>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No referrals yet"
              text="Referrals connected to your member profile will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
