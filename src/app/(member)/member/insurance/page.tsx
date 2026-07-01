import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPeso, statusTone } from "@/features/member-records/format";
import { createClient } from "@/lib/supabase/server";

export default async function InsurancePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: records } = user
    ? await supabase
        .from("insurance_records")
        .select("*")
        .eq("member_id", user.id)
        .order("expiry_date", { ascending: true })
    : { data: [] };

  const productIds = Array.from(
    new Set(
      (records ?? [])
        .map((record) => record.product_id)
        .filter((productId): productId is string => Boolean(productId))
    )
  );
  const { data: products } =
    productIds.length > 0
      ? await supabase.from("insurance_products").select("*").in("id", productIds)
      : { data: [] };
  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  return (
    <>
      <PageHeader
        title="Insurance"
        description="View insurance availments, effective dates, expiry dates, and renewal indicators."
      />
      {records && records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => {
            const product = record.product_id ? productById.get(record.product_id) : null;

            return (
              <article
                key={record.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
                    <h2 className="mt-3 text-lg font-semibold text-[#0F172A]">
                      {product?.name ?? record.provider ?? "Insurance record"}
                    </h2>
                    <p className="mt-1 text-sm text-[#475569]">
                      Policy: {record.policy_number ?? "Not set"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-[#334155]">Coverage</p>
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {formatPeso(record.coverage_amount)}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-[#334155]">Effective</dt>
                    <dd className="mt-1 text-[#475569]">{formatDate(record.effective_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Expires</dt>
                    <dd className="mt-1 text-[#475569]">{formatDate(record.expiry_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Premium</dt>
                    <dd className="mt-1 text-[#475569]">{formatPeso(record.premium_amount)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No insurance records yet"
          text="Insurance records will appear after admin entry or import."
        />
      )}
    </>
  );
}
