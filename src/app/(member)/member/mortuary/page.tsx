import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime, formatPeso, statusTone } from "@/features/member-records/format";
import { createClient } from "@/lib/supabase/server";

export default async function MortuaryPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: records }, { data: claims }] = user
    ? await Promise.all([
        supabase
          .from("mortuary_records")
          .select("*")
          .eq("member_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("mortuary_claims")
          .select("*")
          .eq("member_id", user.id)
          .order("submitted_at", { ascending: false })
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <>
      <PageHeader
        title="Mortuary"
        description="View mortuary availment records and claim-ready metadata."
      />
      <div className="grid gap-6">
        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Availments</h2>
          {records && records.length > 0 ? (
            records.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
                    <h3 className="mt-3 text-lg font-semibold text-[#0F172A]">
                      Beneficiary: {record.beneficiary_name ?? "Not set"}
                    </h3>
                    <p className="mt-1 text-sm text-[#475569]">
                      {record.beneficiary_relationship ?? "Relationship not set"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-[#0F172A]">
                    {formatPeso(record.contribution_amount)}
                  </p>
                </div>
                <dl className="mt-4 grid gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-[#334155]">Effective date</dt>
                    <dd className="mt-1 text-[#475569]">{formatDate(record.effective_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Beneficiary contact</dt>
                    <dd className="mt-1 text-[#475569]">
                      {record.beneficiary_contact ?? "Not set"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <EmptyState
              title="No mortuary records yet"
              text="Mortuary availments will appear here once recorded."
            />
          )}
        </section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Claims</h2>
          {claims && claims.length > 0 ? (
            claims.map((claim) => (
              <article
                key={claim.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone={statusTone(claim.status)}>{claim.status}</StatusBadge>
                    <h3 className="mt-3 text-lg font-semibold text-[#0F172A]">
                      {claim.claimant_name}
                    </h3>
                    <p className="mt-1 text-sm text-[#475569]">
                      Submitted {formatDateTime(claim.submitted_at)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-[#0F172A]">
                    {formatPeso(claim.claim_amount)}
                  </p>
                </div>
                {claim.decision_note ? (
                  <p className="mt-4 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#334155]">
                    Decision note: {claim.decision_note}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="No mortuary claims yet"
              text="Submitted mortuary claims and review decisions will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
