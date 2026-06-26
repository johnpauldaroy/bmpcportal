import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPeso, statusTone } from "@/features/member-records/format";
import { createClient } from "@/lib/supabase/server";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: certificates } = user
    ? await supabase
        .from("share_certificates")
        .select("*")
        .eq("member_id", user.id)
        .order("threshold_number", { ascending: true })
    : { data: [] };

  return (
    <>
      <PageHeader
        title="Share certificates"
        description="One digital certificate is generated for every 10,000 share capital threshold."
      />
      {certificates && certificates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusBadge tone={statusTone(certificate.status)}>
                    {certificate.status}
                  </StatusBadge>
                  <h2 className="mt-3 text-lg font-semibold text-[#10233f]">
                    {certificate.certificate_number}
                  </h2>
                  <p className="mt-1 text-sm text-[#5f6c7b]">
                    Threshold #{certificate.threshold_number}
                  </p>
                </div>
                <p className="text-lg font-semibold text-[#10233f]">
                  {formatPeso(certificate.share_capital_amount)}
                </p>
              </div>
              <dl className="mt-4 grid gap-3 rounded-md border border-[#e1e8ef] bg-[#f8fafc] p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-[#344456]">Issued</dt>
                  <dd className="mt-1 text-[#5f6c7b]">
                    {formatDate(certificate.issued_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#344456]">File</dt>
                  <dd className="mt-1 text-[#5f6c7b]">
                    {certificate.storage_path ? "Available privately" : "Pending generation"}
                  </dd>
                </div>
              </dl>
              {certificate.storage_path && certificate.status === "issued" ? (
                <ButtonLink
                  className="mt-4"
                  href={`/api/member/certificates/${certificate.id}/download`}
                  intent="secondary"
                >
                  Download certificate
                </ButtonLink>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No certificates yet"
          text="Certificates will be generated after approved share capital imports."
        />
      )}
    </>
  );
}
