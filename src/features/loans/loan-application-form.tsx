"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { LoanAttachmentKind } from "@/types/database";
import { formatPeso, pesosToWords } from "./loan-utils";
import {
  loanPurposeOptions,
  propertyDescriptionOptions,
  securityOfferedOptions
} from "./application-options";
import {
  BannerNote,
  CheckboxGroup,
  FieldGrid,
  FileField,
  RadioGroup,
  SectionHeading,
  SelectField,
  StepProgress,
  TextField
} from "./application-form-fields";
import { emptyPerson, PersonFieldset, type PersonState } from "./person-fieldset";
import {
  CoMakerInviteFieldset,
  emptyCoMakerInvite,
  type CoMakerInviteState
} from "./co-maker-invite-fieldset";
import { defaultLoanProductChoices, type LoanProductChoice } from "./product-options";
import { SignaturePad } from "./signature-pad";

export type BranchChoice = { id: string; name: string };

type PropertyState = {
  description: string;
  landTitleNumber: string;
  lotNumber: string;
  location: string;
  lotAreaSqm: string;
};

type ApplicantAttachmentKind =
  | "applicant_signature"
  | "applicant_id_front"
  | "applicant_id_back"
  | "applicant_id_selfie";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const applicantAttachmentSlots: {
  kind: ApplicantAttachmentKind;
  label: string;
  capture?: "user" | "environment";
}[] = [
  { kind: "applicant_signature", label: "Signature" },
  { kind: "applicant_id_front", label: "ID Front Side", capture: "environment" },
  { kind: "applicant_id_back", label: "ID Back Side", capture: "environment" },
  { kind: "applicant_id_selfie", label: "Selfie with your ID", capture: "user" }
];

const steps = [
  "Loan Info",
  "Applicant",
  "Real Property",
  "Co-Makers",
  "ID Verification",
  "Review"
];

function emptyProperty(): PropertyState {
  return { description: "", landTitleNumber: "", lotNumber: "", location: "", lotAreaSqm: "" };
}

function numberOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

function personPayload(person: PersonState) {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    middleName: person.middleName,
    presentAddress: person.presentAddress,
    permanentAddress: person.permanentAddress,
    phoneNo: person.phoneNo,
    landlineNo: person.landlineNo,
    otherContactNo: person.otherContactNo,
    email: person.email,
    civilStatus: person.civilStatus,
    noOfDependents: person.noOfDependents,
    occupation: person.occupation,
    employer: person.employer,
    monthlySalary: numberOrUndefined(person.monthlySalary),
    employmentStatus: person.employmentStatus || undefined,
    otherMonthlyIncome: numberOrUndefined(person.otherMonthlyIncome),
    taxIdentificationNumber: person.taxIdentificationNumber,
    validId: person.validId || undefined,
    idNumber: person.idNumber,
    spouseName: person.spouseName,
    shareCapitalAsOf: person.shareCapitalAsOf,
    shareCapitalAmount: numberOrUndefined(person.shareCapitalAmount)
  };
}

export function LoanApplicationForm({
  products,
  branches,
  onSuccess
}: {
  products: LoanProductChoice[];
  branches: BranchChoice[];
  onSuccess?: () => void;
}) {
  const productChoices = products.length > 0 ? products : defaultLoanProductChoices;
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [selectedProductKey, setSelectedProductKey] = useState(
    productChoices[0]?.id ?? productChoices[0]?.code ?? ""
  );
  const [securityOffered, setSecurityOffered] = useState<string[]>([]);
  const [amountRequested, setAmountRequested] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [purpose, setPurpose] = useState("");
  const [preferredTermMonths, setPreferredTermMonths] = useState("");
  const [firstPaymentDue, setFirstPaymentDue] = useState("");
  const [branchId, setBranchId] = useState("");

  const [applicant, setApplicant] = useState<PersonState>(emptyPerson);
  const [spouseEmployer, setSpouseEmployer] = useState("");
  const [spouseMonthlySalary, setSpouseMonthlySalary] = useState("");

  const [properties, setProperties] = useState<PropertyState[]>([emptyProperty()]);
  const [firstCoMaker, setFirstCoMaker] = useState<CoMakerInviteState>(emptyCoMakerInvite);
  const [secondCoMaker, setSecondCoMaker] = useState<CoMakerInviteState>(emptyCoMakerInvite);

  const [files, setFiles] = useState<Partial<Record<ApplicantAttachmentKind, File>>>({});
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [consent, setConsent] = useState(false);

  function setSignatureFile(file: File | null) {
    setFiles((current) => {
      const next = { ...current };
      if (file) next.applicant_signature = file;
      else delete next.applicant_signature;
      return next;
    });
  }

  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    applicationNumber: string | null;
    coMakerCount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyReference(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const selectedProduct = useMemo(
    () =>
      productChoices.find((product) => (product.id ?? product.code) === selectedProductKey) ?? null,
    [productChoices, selectedProductKey]
  );

  function onAmountChange(value: string) {
    setAmountRequested(value);
    setAmountInWords(value.trim() === "" ? "" : pesosToWords(value));
  }

  function toggleSecurity(value: string) {
    setSecurityOffered((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function patchProperty(index: number, patch: Partial<PropertyState>) {
    setProperties((current) =>
      current.map((property, i) => (i === index ? { ...property, ...patch } : property))
    );
  }

  function removeProperty(index: number) {
    setProperties((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : current
    );
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!selectedProduct) return "Please choose a loan product.";
      if (securityOffered.length === 0) return "Please choose at least one security offered.";
      if (!amountRequested.trim() || !amountInWords.trim()) return "Loan amount is required.";
      if (!purpose) return "Please choose a loan purpose.";
      if (!preferredTermMonths.trim()) return "Loan term is required.";
      if (!firstPaymentDue) return "First payment date is required.";
      if (!branchId) return "Please choose your branch.";
    }
    if (index === 1) {
      const required: [string, string][] = [
        [applicant.firstName, "First name"],
        [applicant.lastName, "Last name"],
        [applicant.middleName, "Middle name"],
        [applicant.presentAddress, "Present address"],
        [applicant.permanentAddress, "Permanent address"],
        [applicant.phoneNo, "Phone no."],
        [applicant.email, "Email"],
        [applicant.civilStatus, "Civil status"],
        [applicant.noOfDependents, "No. of dependents"],
        [applicant.occupation, "Occupation"]
      ];
      const missing = required.find(([value]) => !value.trim());
      if (missing) return `${missing[1]} is required.`;
    }
    if (index === 3) {
      for (const [coMaker, label] of [
        [firstCoMaker, "First co-maker"],
        [secondCoMaker, "Second co-maker"]
      ] as const) {
        if (!coMaker.firstName.trim() || !coMaker.lastName.trim()) {
          return `${label} name is required.`;
        }
        if (!coMaker.contactNo.trim()) return `${label} contact number is required.`;
        if (!coMaker.email.trim()) return `${label} email is required.`;
      }
    }
    if (index === 4 && !files.applicant_signature) {
      return "Your signature image is required.";
    }
    if (index === 4 && (!files.applicant_id_front || !files.applicant_id_back)) {
      return "Government ID front and back images are required.";
    }
    if (index === 4 && !files.applicant_id_selfie) {
      return "A selfie holding your ID is required.";
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setMessage(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function uploadFiles(userId: string) {
    const supabase = createClient();
    const uploaded: {
      kind: LoanAttachmentKind;
      bucketId: string;
      storagePath: string;
      fileName: string;
      contentType: string;
      byteSize: number;
    }[] = [];

    for (const slot of applicantAttachmentSlots) {
      const file = files[slot.kind];
      if (!file) continue;
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`${slot.label} exceeds the 20MB limit.`);
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const storagePath = `${userId}/loans/${Date.now()}-${slot.kind}.${extension}`;
      const { error } = await supabase.storage
        .from("loan-attachments")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (error) {
        throw new Error(`Could not upload ${slot.label}: ${error.message}`);
      }

      uploaded.push({
        kind: slot.kind,
        bucketId: "loan-attachments",
        storagePath,
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size
      });
    }

    return uploaded;
  }

  async function submit() {
    const error = validateStep(4);
    if (error) {
      setMessage(error);
      return;
    }
    if (!consent) {
      setMessage("Please certify the information and accept the Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const attachments = await uploadFiles(user.id);

      const realProperties = properties
        .filter((property) =>
          [property.description, property.landTitleNumber, property.lotNumber, property.location]
            .some((value) => value.trim() !== "")
        )
        .map((property) => ({
          ownerRole: "applicant" as const,
          description: property.description || undefined,
          landTitleNumber: property.landTitleNumber,
          lotNumber: property.lotNumber,
          location: property.location,
          lotAreaSqm: numberOrUndefined(property.lotAreaSqm)
        }));

      const payload = {
        productId: selectedProduct?.id,
        productCode: selectedProduct?.code,
        amountRequested,
        amountInWords,
        preferredTermMonths,
        purpose,
        securityOffered,
        firstPaymentDue,
        branchId,
        applicant: {
          ...personPayload(applicant),
          spouseEmployer,
          spouseMonthlySalary: numberOrUndefined(spouseMonthlySalary)
        },
        realProperties,
        coMakers: [firstCoMaker, secondCoMaker].map((coMaker) => ({
          firstName: coMaker.firstName,
          lastName: coMaker.lastName,
          middleName: coMaker.middleName,
          contactNo: coMaker.contactNo,
          email: coMaker.email
        })),
        attachments,
        consent
      };

      const response = await fetch("/api/member/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.ok === false) {
        throw new Error(result.error ?? "Loan application could not be submitted.");
      }

      onSuccess?.();
      const coMakerCount = [firstCoMaker, secondCoMaker].filter(
        (coMaker) => coMaker.firstName.trim() && coMaker.lastName.trim()
      ).length;
      setSubmitted({
        applicationNumber:
          typeof result.application_number === "string" ? result.application_number : null,
        coMakerCount
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="grid place-items-center gap-5 rounded-2xl border border-[#bfe3d8] bg-[#f3fbf8] px-6 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#d1ece6] text-[#0b5d53]">
          <CheckCircle2 aria-hidden size={40} />
        </span>
        <div className="grid gap-2">
          <h2 className="text-xl font-bold text-[#0b5d53]">Application submitted successfully</h2>
          <p className="mx-auto max-w-md text-sm leading-6 text-[#395a52]">
            Thank you! Your loan application has been received. Please wait for the assistance of our
            staff &mdash; they will review your details and contact you about the next steps. No
            further action is needed from you right now.
          </p>
          {submitted.coMakerCount > 0 ? (
            <p className="mx-auto max-w-md text-sm leading-6 text-[#395a52]">
              We&apos;ve emailed your {submitted.coMakerCount === 1 ? "co-maker" : "co-makers"} a
              link to complete their part. Your application proceeds once{" "}
              {submitted.coMakerCount === 1 ? "they finish" : "they both finish"}.
            </p>
          ) : null}
          {submitted.applicationNumber ? (
            <div className="mx-auto flex flex-wrap items-center justify-center gap-2 text-sm text-[#395a52]">
              <span>
                Reference number:{" "}
                <span className="font-semibold text-[#0b5d53]">{submitted.applicationNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => copyReference(submitted.applicationNumber!)}
                className="inline-flex items-center gap-1 rounded-md border border-[#bfe3d8] bg-white px-2 py-1 text-xs font-semibold text-[#0b5d53] transition hover:bg-[#e9f6f1]"
              >
                {copied ? (
                  <>
                    <Check aria-hidden size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy aria-hidden size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => {
              router.push("/member/loans");
              router.refresh();
            }}
          >
            View my applications
            <ArrowRight aria-hidden size={18} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <StepProgress steps={steps} current={step} />

      {step === 0 ? (
        <section className="grid gap-4">
          <SectionHeading>Loan Information</SectionHeading>

          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            <span>
              Loan Applied For
              <span className="text-[#b42318]"> *</span>
            </span>
            <select
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              value={selectedProductKey}
              onChange={(event) => setSelectedProductKey(event.target.value)}
              required
            >
              {productChoices.map((product) => (
                <option key={product.id ?? product.code} value={product.id ?? product.code}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          {selectedProduct ? (
            <p className="rounded-md border border-[#e1e8ef] bg-[#f8fafc] px-3 py-2 text-sm text-[#5f6c7b]">
              {formatPeso(selectedProduct.min_amount)} to {formatPeso(selectedProduct.max_amount)}
              {" | "}
              {selectedProduct.min_term_months}-{selectedProduct.max_term_months} months
            </p>
          ) : null}

          <CheckboxGroup
            label="Security Offered"
            required
            options={securityOfferedOptions}
            values={securityOffered}
            onToggle={toggleSecurity}
          />

          <FieldGrid>
            <TextField
              label="Loan Amount in Numbers"
              required
              inputMode="decimal"
              value={amountRequested}
              onChange={onAmountChange}
            />
            <TextField
              label="Loan Amount in Words"
              required
              value={amountInWords}
              onChange={setAmountInWords}
            />
            <SelectField
              label="Loan Purpose"
              required
              options={loanPurposeOptions}
              value={purpose}
              onChange={setPurpose}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              label="Loan Term (months)"
              required
              inputMode="numeric"
              placeholder="How many months?"
              value={preferredTermMonths}
              onChange={setPreferredTermMonths}
            />
            <TextField
              label="1st Payment to Fall Due On"
              required
              type="date"
              value={firstPaymentDue}
              onChange={setFirstPaymentDue}
            />
            <SelectField
              label="Branch"
              required
              options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
              value={branchId}
              onChange={setBranchId}
            />
          </FieldGrid>
          <p className="text-sm text-[#b42318]">
            Please ensure to choose the branch where your membership is registered.
          </p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="grid gap-4">
          <SectionHeading>Applicant&apos;s Statement</SectionHeading>
          <BannerNote>Note: if not applicable put NA or None.</BannerNote>
          <PersonFieldset
            person={applicant}
            onChange={(patch) => setApplicant((current) => ({ ...current, ...patch }))}
          />
          <FieldGrid>
            <TextField
              label="Spouse's Employer"
              value={spouseEmployer}
              onChange={setSpouseEmployer}
            />
            <TextField
              label="Spouse's Monthly Salary"
              inputMode="decimal"
              value={spouseMonthlySalary}
              onChange={setSpouseMonthlySalary}
            />
          </FieldGrid>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-4">
          <SectionHeading>Real Property Owned</SectionHeading>
          <BannerNote>Optional. Leave blank if not applicable.</BannerNote>
          {properties.map((property, index) => (
            <div key={index} className="grid gap-4 rounded-md border border-[#e1e8ef] p-4">
              {properties.length > 1 ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeProperty(index)}
                    className="text-sm font-medium text-[#b42318] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <RadioGroup
                label={`Description${properties.length > 1 ? ` (${index + 1})` : ""}`}
                options={propertyDescriptionOptions}
                value={property.description}
                onChange={(value) => patchProperty(index, { description: value })}
              />
              <FieldGrid>
                <TextField
                  label="Land Title Number"
                  value={property.landTitleNumber}
                  onChange={(value) => patchProperty(index, { landTitleNumber: value })}
                />
                <TextField
                  label="Lot Number"
                  value={property.lotNumber}
                  onChange={(value) => patchProperty(index, { lotNumber: value })}
                />
                <TextField
                  label="Location"
                  value={property.location}
                  onChange={(value) => patchProperty(index, { location: value })}
                />
              </FieldGrid>
              <TextField
                label="Lot Area (sqm)"
                inputMode="decimal"
                value={property.lotAreaSqm}
                onChange={(value) => patchProperty(index, { lotAreaSqm: value })}
              />
            </div>
          ))}
          {properties.length < 3 ? (
            <Button
              intent="secondary"
              className="justify-self-start"
              onClick={() => setProperties((current) => [...current, emptyProperty()])}
            >
              Add real property
            </Button>
          ) : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-6">
          <SectionHeading>Co-Makers</SectionHeading>
          <BannerNote>
            Enter each co-maker&apos;s name and contact only. We&apos;ll email them a secure link so
            they can fill in their own details and upload their signature and valid ID.
          </BannerNote>
          <div className="grid gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#344456]">
              First Co-Maker
            </h3>
            <CoMakerInviteFieldset
              coMaker={firstCoMaker}
              onChange={(patch) => setFirstCoMaker((current) => ({ ...current, ...patch }))}
            />
          </div>
          <div className="grid gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#344456]">
              Second Co-Maker
            </h3>
            <CoMakerInviteFieldset
              coMaker={secondCoMaker}
              onChange={(patch) => setSecondCoMaker((current) => ({ ...current, ...patch }))}
            />
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="grid gap-4">
          <SectionHeading>Applicant&apos;s ID Verification</SectionHeading>
          <BannerNote>
            Sign directly in the box below, or switch to uploading a photo of your signature.
            Upload your government ID front and back. Accepts .jpeg, .jpg, .png up to 20MB each.
          </BannerNote>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#344456]">
                Signature
                <span className="text-[#b42318]"> *</span>
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureMode("draw");
                    setSignatureFile(null);
                  }}
                  className={
                    "rounded-full px-3 py-1 font-semibold " +
                    (signatureMode === "draw"
                      ? "bg-[#136f63] text-white"
                      : "bg-[#eef2f6] text-[#5f6c7b]")
                  }
                >
                  Draw signature
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignatureMode("upload");
                    setSignatureFile(null);
                  }}
                  className={
                    "rounded-full px-3 py-1 font-semibold " +
                    (signatureMode === "upload"
                      ? "bg-[#136f63] text-white"
                      : "bg-[#eef2f6] text-[#5f6c7b]")
                  }
                >
                  Upload photo
                </button>
              </div>
            </div>
            {signatureMode === "draw" ? (
              <SignaturePad onChange={setSignatureFile} />
            ) : (
              <FileField
                label="Signature photo"
                required
                fileName={files.applicant_signature?.name ?? null}
                onSelect={setSignatureFile}
              />
            )}
          </div>
          <FieldGrid>
            {applicantAttachmentSlots
              .filter((slot) => slot.kind !== "applicant_signature")
              .map((slot) => (
                <FileField
                  key={slot.kind}
                  label={slot.label}
                  required
                  capture={slot.capture}
                  fileName={files[slot.kind]?.name ?? null}
                  onSelect={(file) =>
                    setFiles((current) => {
                      const next = { ...current };
                      if (file) next[slot.kind] = file;
                      else delete next[slot.kind];
                      return next;
                    })
                  }
                />
              ))}
          </FieldGrid>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="grid gap-4">
          <SectionHeading>Review &amp; Submit</SectionHeading>
          <dl className="grid gap-2 rounded-md border border-[#e1e8ef] bg-[#f8fafc] p-4 text-sm">
            <Row label="Loan applied for" value={selectedProduct?.name ?? "—"} />
            <Row label="Amount" value={amountRequested ? formatPeso(amountRequested) : "—"} />
            <Row label="Term" value={preferredTermMonths ? `${preferredTermMonths} months` : "—"} />
            <Row
              label="Applicant"
              value={`${applicant.firstName} ${applicant.lastName}`.trim() || "—"}
            />
            <Row label="First co-maker" value={coMakerSummary(firstCoMaker)} />
            <Row label="Second co-maker" value={coMakerSummary(secondCoMaker)} />
            <Row
              label="Uploads"
              value={`${Object.keys(files).length} of ${applicantAttachmentSlots.length} files attached`}
            />
          </dl>
          <label className="flex items-start gap-2 text-sm text-[#344456]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1"
            />
            I certify that the information provided is true and correct and I accept the Privacy
            Policy.
          </label>
        </section>
      ) : null}

      {message ? <p className="text-sm font-medium text-[#8f1f16]">{message}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button intent="secondary" onClick={goBack} disabled={step === 0 || isSubmitting}>
          <ArrowLeft aria-hidden size={18} />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={goNext}>
            Next
            <ArrowRight aria-hidden size={18} />
          </Button>
        ) : (
          <Button onClick={submit} disabled={isSubmitting}>
            <Send aria-hidden size={18} />
            {isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[#5f6c7b]">{label}</dt>
      <dd className="font-semibold text-[#17263a]">{value}</dd>
    </div>
  );
}

function coMakerSummary(coMaker: CoMakerInviteState) {
  const name = `${coMaker.firstName} ${coMaker.lastName}`.trim();
  if (!name) return "—";
  return coMaker.email ? `${name} (${coMaker.email})` : name;
}
