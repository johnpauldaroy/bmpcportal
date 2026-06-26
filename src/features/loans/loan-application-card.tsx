"use client";

import {
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  FileUp,
  Home,
  Paperclip,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanApplicationWithDetails } from "./data";
import {
  civilStatusOptions,
  employmentStatusOptions,
  loanPurposeOptions,
  loanTypeOptions,
  occupationOptions,
  propertyDescriptionOptions,
  securityOfferedOptions,
  validIdOptions
} from "./application-options";
import { LoanHistoryList } from "./loan-history-list";
import { formatDateTime, formatPeso, loanStatusLabel, loanStatusTone } from "./loan-utils";

type DetailTab = "application" | "applicant" | "co_makers" | "properties" | "uploads" | "timeline";
type LoanAttachmentPreview = LoanApplicationWithDetails["attachments"][number];

const tabs: { id: DetailTab; label: string; icon: ReactNode }[] = [
  { id: "application", label: "Application", icon: <FileText size={14} /> },
  { id: "applicant", label: "Applicant", icon: <UserRound size={14} /> },
  { id: "co_makers", label: "Co-makers", icon: <UsersRound size={14} /> },
  { id: "properties", label: "Properties", icon: <Home size={14} /> },
  { id: "uploads", label: "Uploads", icon: <Paperclip size={14} /> },
  { id: "timeline", label: "Timeline", icon: <Clock size={14} /> }
];

const optionLabel = (options: { value: string; label: string }[], value: string | null) =>
  value ? (options.find((option) => option.value === value)?.label ?? value) : "-";

const attachmentKindLabel: Record<string, string> = {
  applicant_signature: "Applicant signature",
  applicant_id_front: "Applicant ID front",
  applicant_id_back: "Applicant ID back",
  applicant_id_selfie: "Selfie with ID",
  spouse_signature: "Spouse signature",
  spouse_id_front: "Spouse ID front",
  spouse_id_back: "Spouse ID back",
  first_co_maker_signature: "First co-maker signature",
  first_co_maker_id_front: "First co-maker ID front",
  first_co_maker_id_back: "First co-maker ID back",
  second_co_maker_signature: "Second co-maker signature",
  second_co_maker_id_front: "Second co-maker ID front",
  second_co_maker_id_back: "Second co-maker ID back"
};

export function LoanApplicationCard({
  applications
}: {
  applications: LoanApplicationWithDetails[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) ?? null,
    [applications, selectedId]
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#10233f]">Your applications</h2>
          <p className="mt-1 text-sm text-[#5f6c7b]">
            Track each application from submission through release or decision.
          </p>
        </div>
        <Link
          href="/member/loans/new"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: "#136f63" }}
        >
          <FileUp size={16} />
          Start application
        </Link>
      </div>

      {applications.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#d8e1ea] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: "#f0f4f8", borderBottom: "1px solid #e1e8ef" }}>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Application #</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Product</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Term</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#5f6c7b]"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => {
                const isLast = index === applications.length - 1;
                return (
                  <tr
                    key={app.id}
                    style={{ borderBottom: isLast ? "none" : "1px solid #f0f4f8" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#10233f]">
                      {app.application_number}
                    </td>
                    <td className="px-4 py-3 text-[#344456]">{app.product?.name ?? "-"}</td>
                    <td className="px-4 py-3 font-semibold text-[#10233f]">
                      {formatPeso(app.amount_requested)}
                    </td>
                    <td className="px-4 py-3 text-[#5f6c7b]">
                      {app.preferred_term_months} mo.
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5f6c7b]">
                      {formatDateTime(app.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={loanStatusTone(app.status)}>
                        {loanStatusLabel[app.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(app.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#5f6c7b] transition-colors hover:bg-[#eef2f6] hover:text-[#10233f]"
                      >
                        <ChevronDown size={15} />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No loan applications yet"
          text="Click 'Start application' to submit your first loan request."
        />
      )}

      {selectedApplication ? (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

// Tabbed application detail body, shared by the member modal and the admin
// detail page. `attachmentViewBase` lets each context point attachment previews
// at its own authorized endpoint (member vs. admin).
export function LoanApplicationDetailTabs({
  application,
  attachmentViewBase = "/api/member/loans/attachments"
}: {
  application: LoanApplicationWithDetails;
  attachmentViewBase?: string;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("application");
  const [previewAttachment, setPreviewAttachment] = useState<LoanAttachmentPreview | null>(null);
  const applicantName = [
    application.applicant_first_name,
    application.applicant_middle_name,
    application.applicant_last_name
  ]
    .filter(Boolean)
    .join(" ");
  const loanType =
    application.loan_type === "others" && application.loan_type_other
      ? application.loan_type_other
      : optionLabel(loanTypeOptions, application.loan_type);

  return (
    <>
      <div className="border-b border-[#e1e8ef] px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Application details">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={
                  "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold " +
                  (isActive
                    ? "border-[#136f63] text-[#0b5d53]"
                    : "border-transparent text-[#5f6c7b] hover:text-[#10233f]")
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-y-auto bg-[#f8fafc] p-5">
        {activeTab === "application" ? (
          <DetailSection icon={<FileText size={13} />} title="Application details">
            <DetailGrid>
              <DetailItem label="Loan type" value={loanType} />
              <DetailItem label="Product" value={application.product?.name ?? "-"} />
              <DetailItem
                label="Purpose"
                value={optionLabel(loanPurposeOptions, application.purpose)}
              />
              <DetailItem
                label="Security offered"
                value={
                  application.security_offered.length > 0
                    ? application.security_offered
                        .map((security) => optionLabel(securityOfferedOptions, security))
                        .join(", ")
                    : "-"
                }
              />
              <DetailItem label="Amount" value={formatPeso(application.amount_requested)} />
              <DetailItem label="Amount in words" value={application.amount_in_words ?? "-"} />
              <DetailItem
                label="Preferred term"
                value={`${application.preferred_term_months} months`}
              />
              <DetailItem label="Branch" value={application.branch?.name ?? "-"} />
              <DetailItem label="First payment due" value={application.first_payment_due ?? "-"} />
            </DetailGrid>
            {application.decision_note ? (
              <div className="mt-3 rounded-lg bg-[#e5f3ef] px-3 py-2 text-sm text-[#0b5d53]">
                <span className="font-semibold">Decision: </span>
                {application.decision_note}
              </div>
            ) : null}
          </DetailSection>
        ) : null}

        {activeTab === "applicant" ? (
          <DetailSection icon={<UserRound size={13} />} title="Applicant details">
            <DetailGrid>
              <DetailItem label="Name" value={applicantName || "-"} />
              <DetailItem label="Email" value={application.applicant_email ?? "-"} />
              <DetailItem label="Phone" value={application.phone_no ?? "-"} />
              <DetailItem label="Landline" value={application.landline_no ?? "-"} />
              <DetailItem label="Other contact" value={application.other_contact_no ?? "-"} />
              <DetailItem
                label="Civil status"
                value={optionLabel(civilStatusOptions, application.civil_status)}
              />
              <DetailItem
                label="Dependents"
                value={
                  application.no_of_dependents === null
                    ? "-"
                    : String(application.no_of_dependents)
                }
              />
              <DetailItem
                label="Occupation"
                value={optionLabel(occupationOptions, application.occupation)}
              />
              <DetailItem
                label="Employment status"
                value={optionLabel(employmentStatusOptions, application.employment_status)}
              />
              <DetailItem label="Employer" value={application.employer ?? "-"} />
              <DetailItem
                label="Monthly salary"
                value={
                  application.monthly_salary === null
                    ? "-"
                    : formatPeso(application.monthly_salary)
                }
              />
              <DetailItem
                label="Other monthly income"
                value={
                  application.other_monthly_income === null
                    ? "-"
                    : formatPeso(application.other_monthly_income)
                }
              />
              <DetailItem
                label="Valid ID"
                value={optionLabel(validIdOptions, application.valid_id)}
              />
              <DetailItem label="ID number" value={application.id_number ?? "-"} />
              <DetailItem label="TIN" value={application.tax_identification_number ?? "-"} />
              <DetailItem
                label="Present address"
                value={application.present_address ?? "-"}
                wide
              />
              <DetailItem
                label="Permanent address"
                value={application.permanent_address ?? "-"}
                wide
              />
              <DetailItem label="Spouse" value={application.spouse_name ?? "-"} />
              <DetailItem
                label="Share capital"
                value={
                  application.share_capital_amount === null
                    ? "-"
                    : formatPeso(application.share_capital_amount)
                }
              />
            </DetailGrid>
          </DetailSection>
        ) : null}

        {activeTab === "co_makers" ? (
          <DetailSection icon={<UsersRound size={13} />} title="Co-makers">
            {application.coMakers.length > 0 ? (
              <div className="grid gap-3">
                {application.coMakers.map((coMaker) => (
                  <div
                    key={coMaker.id}
                    className="rounded-lg border border-[#e1e8ef] bg-[#f8fafc] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#10233f]">
                        {[coMaker.first_name, coMaker.middle_name, coMaker.last_name]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                      <StatusBadge
                        tone={coMaker.invite_status === "completed" ? "success" : "warning"}
                      >
                        {coMaker.co_maker_role === "first" ? "First co-maker" : "Second co-maker"}{" "}
                        - {coMaker.invite_status}
                      </StatusBadge>
                    </div>
                    <DetailGrid className="mt-3">
                      <DetailItem label="Email" value={coMaker.email} />
                      <DetailItem label="Contact no." value={coMaker.contact_no ?? "-"} />
                      <DetailItem label="Phone" value={coMaker.phone_no ?? "-"} />
                      <DetailItem
                        label="Occupation"
                        value={optionLabel(occupationOptions, coMaker.occupation)}
                      />
                      <DetailItem label="Employer" value={coMaker.employer ?? "-"} />
                      <DetailItem
                        label="Monthly salary"
                        value={
                          coMaker.monthly_salary === null
                            ? "-"
                            : formatPeso(coMaker.monthly_salary)
                        }
                      />
                    </DetailGrid>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5f6c7b]">No co-makers listed.</p>
            )}
          </DetailSection>
        ) : null}

        {activeTab === "properties" ? (
          <DetailSection icon={<Home size={13} />} title="Real properties">
            {application.realProperties.length > 0 ? (
              <div className="grid gap-3">
                {application.realProperties.map((property) => (
                  <DetailGrid
                    key={property.id}
                    className="rounded-lg border border-[#e1e8ef] bg-[#f8fafc] p-3"
                  >
                    <DetailItem label="Owner role" value={property.owner_role} />
                    <DetailItem
                      label="Description"
                      value={optionLabel(propertyDescriptionOptions, property.description)}
                    />
                    <DetailItem
                      label="Land title no."
                      value={property.land_title_number ?? "-"}
                    />
                    <DetailItem label="Lot no." value={property.lot_number ?? "-"} />
                    <DetailItem
                      label="Lot area"
                      value={
                        property.lot_area_sqm === null
                          ? "-"
                          : `${Number(property.lot_area_sqm).toLocaleString("en-PH")} sqm`
                      }
                    />
                    <DetailItem label="Location" value={property.location ?? "-"} wide />
                  </DetailGrid>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5f6c7b]">No real properties listed.</p>
            )}
          </DetailSection>
        ) : null}

        {activeTab === "uploads" ? (
          <DetailSection icon={<Paperclip size={13} />} title="Uploads">
            {application.attachments.length > 0 ? (
              <ul className="grid gap-2 text-sm text-[#344456]">
                {application.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e1e8ef] bg-[#f8fafc] px-3 py-2"
                  >
                    <span>
                      <span className="block font-semibold">
                        {attachmentKindLabel[attachment.kind] ?? attachment.kind}
                      </span>
                      <span className="block text-[#5f6c7b]">
                        {attachment.file_name ?? "Uploaded file"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(attachment)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#cbd7e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#344456] transition hover:bg-[#eef2f6] hover:text-[#10233f]"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#5f6c7b]">No uploads listed.</p>
            )}
          </DetailSection>
        ) : null}

        {activeTab === "timeline" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailSection icon={<Calendar size={13} />} title="Timeline">
              <div className="grid gap-2 text-sm text-[#5f6c7b]">
                <div className="flex justify-between gap-3">
                  <span>Submitted</span>
                  <span className="font-medium text-[#344456]">
                    {formatDateTime(application.submitted_at)}
                  </span>
                </div>
                {application.reviewed_at ? (
                  <div className="flex justify-between gap-3">
                    <span>Reviewed</span>
                    <span className="font-medium text-[#344456]">
                      {formatDateTime(application.reviewed_at)}
                    </span>
                  </div>
                ) : null}
                {application.released_at ? (
                  <div className="flex justify-between gap-3">
                    <span>Released</span>
                    <span className="font-medium text-[#136f63]">
                      {formatDateTime(application.released_at)}
                    </span>
                  </div>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection icon={<Clock size={13} />} title="Status history">
              <LoanHistoryList history={application.history} />
            </DetailSection>
          </div>
        ) : null}
      </div>

      {previewAttachment ? (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          viewBase={attachmentViewBase}
          onClose={() => setPreviewAttachment(null)}
        />
      ) : null}
    </>
  );
}

function ApplicationDetailsModal({
  application,
  onClose
}: {
  application: LoanApplicationWithDetails;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#10233f]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-application-details-title"
      onMouseDown={onClose}
    >
      <div
        className="grid max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e8ef] px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="loan-application-details-title" className="text-lg font-semibold text-[#10233f]">
                {application.application_number}
              </h2>
              <StatusBadge tone={loanStatusTone(application.status)}>
                {loanStatusLabel[application.status]}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-[#5f6c7b]">
              {application.product?.name ?? "Loan application"} -{" "}
              {formatPeso(application.amount_requested)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5f6c7b] hover:bg-[#eef2f6] hover:text-[#10233f]"
            aria-label="Close application details"
          >
            <X size={18} />
          </button>
        </div>

        <LoanApplicationDetailTabs application={application} />
      </div>
    </div>
  );
}

function AttachmentPreviewModal({
  attachment,
  viewBase,
  onClose
}: {
  attachment: LoanAttachmentPreview;
  viewBase: string;
  onClose: () => void;
}) {
  const source = `${viewBase}/${attachment.id}/view`;
  const title = attachmentKindLabel[attachment.kind] ?? attachment.kind;
  const fileName = attachment.file_name?.toLowerCase() ?? "";
  const isImage =
    attachment.content_type?.startsWith("image/") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#10233f]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-attachment-preview-title"
      onMouseDown={onClose}
    >
      <div
        className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e8ef] px-5 py-4">
          <div>
            <h3 id="loan-attachment-preview-title" className="text-base font-semibold text-[#10233f]">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[#5f6c7b]">
              {attachment.file_name ?? "Uploaded file"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5f6c7b] hover:bg-[#eef2f6] hover:text-[#10233f]"
            aria-label="Close attachment preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-[28rem] items-center justify-center overflow-auto bg-[#f8fafc] p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source}
              alt={title}
              className="max-h-[72vh] max-w-full rounded-lg border border-[#e1e8ef] bg-white object-contain"
            />
          ) : (
            <iframe
              src={source}
              title={title}
              className="h-[72vh] w-full rounded-lg border border-[#e1e8ef] bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  icon,
  title,
  children
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e1e8ef] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8a99a8]">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailGrid({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={`grid gap-3 sm:grid-cols-2 ${className}`}>{children}</dl>;
}

function DetailItem({
  label,
  value,
  wide
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-bold uppercase tracking-wider text-[#8a99a8]">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-6 text-[#344456]">{value}</dd>
    </div>
  );
}
