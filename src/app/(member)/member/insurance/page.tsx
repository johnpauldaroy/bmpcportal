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
                className="rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
                    <h2 className="mt-3 text-lg font-semibold text-[#10233f]">
                      {product?.name ?? record.provider ?? "Insurance record"}
                    </h2>
                    <p className="mt-1 text-sm text-[#5f6c7b]">
                      Policy: {record.policy_number ?? "Not set"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-[#344456]">Coverage</p>
                    <p className="text-lg font-semibold text-[#10233f]">
                      {formatPeso(record.coverage_amount)}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 rounded-md border border-[#e1e8ef] bg-[#f8fafc] p-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-[#344456]">Effective</dt>
                    <dd className="mt-1 text-[#5f6c7b]">{formatDate(record.effective_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#344456]">Expires</dt>
                    <dd className="mt-1 text-[#5f6c7b]">{formatDate(record.expiry_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#344456]">Premium</dt>
                    <dd className="mt-1 text-[#5f6c7b]">{formatPeso(record.premium_amount)}</dd>
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
