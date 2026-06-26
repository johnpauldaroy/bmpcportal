"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BannerNote,
  FieldGrid,
  FileField,
  SectionHeading,
  SelectField,
  TextField
} from "./application-form-fields";
import {
  civilStatusOptions,
  dependentsOptions,
  employmentStatusOptions,
  occupationOptions,
  validIdOptions
} from "./application-options";

type State = {
  presentAddress: string;
  permanentAddress: string;
  phoneNo: string;
  landlineNo: string;
  otherContactNo: string;
  civilStatus: string;
  noOfDependents: string;
  occupation: string;
  employer: string;
  monthlySalary: string;
  employmentStatus: string;
  otherMonthlyIncome: string;
  taxIdentificationNumber: string;
  validId: string;
  idNumber: string;
  spouseName: string;
  shareCapitalAsOf: string;
  shareCapitalAmount: string;
};

type FileKey = "signature" | "idFront" | "idBack";

const emptyState: State = {
  presentAddress: "",
  permanentAddress: "",
  phoneNo: "",
  landlineNo: "",
  otherContactNo: "",
  civilStatus: "",
  noOfDependents: "",
  occupation: "",
  employer: "",
  monthlySalary: "",
  employmentStatus: "",
  otherMonthlyIncome: "",
  taxIdentificationNumber: "",
  validId: "",
  idNumber: "",
  spouseName: "",
  shareCapitalAsOf: "",
  shareCapitalAmount: ""
};

export function CoMakerCompletionForm({ token }: { token: string }) {
  const [state, setState] = useState<State>(emptyState);
  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function patch(next: Partial<State>) {
    setState((current) => ({ ...current, ...next }));
  }

  function numberOrUndefined(value: string) {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }

  async function onSubmit() {
    if (!files.signature || !files.idFront || !files.idBack) {
      setMessage("Please upload your signature and both sides of your government ID.");
      return;
    }
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        presentAddress: state.presentAddress,
        permanentAddress: state.permanentAddress,
        phoneNo: state.phoneNo,
        landlineNo: state.landlineNo,
        otherContactNo: state.otherContactNo,
        civilStatus: state.civilStatus,
        noOfDependents: state.noOfDependents,
        occupation: state.occupation,
        employer: state.employer,
        monthlySalary: numberOrUndefined(state.monthlySalary),
        employmentStatus: state.employmentStatus || undefined,
        otherMonthlyIncome: numberOrUndefined(state.otherMonthlyIncome),
        taxIdentificationNumber: state.taxIdentificationNumber,
        validId: state.validId,
        idNumber: state.idNumber,
        spouseName: state.spouseName,
        shareCapitalAsOf: state.shareCapitalAsOf,
        shareCapitalAmount: numberOrUndefined(state.shareCapitalAmount),
        consent: true
      };

      const form = new FormData();
      form.set("payload", JSON.stringify(payload));
      form.set("signature", files.signature);
      form.set("idFront", files.idFront);
      form.set("idBack", files.idBack);

      const response = await fetch(`/api/co-maker/${token}`, {
        method: "POST",
        body: form
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.ok === false) {
        throw new Error(result.error ?? "Your co-maker form could not be submitted.");
      }

      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-[#cdeee4] bg-[#e8f7f1] p-6 text-center">
        <h2 className="text-lg font-semibold text-[#0b5d53]">Thank you!</h2>
        <p className="mt-2 text-sm text-[#0b5d53]">
          Your co-maker details and ID verification have been submitted. You may now close this
          page.
        </p>
      </div>
    );
  }

  function setFile(key: FileKey, file: File | null) {
    setFiles((current) => {
      const next = { ...current };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <SectionHeading>Your Statement</SectionHeading>
        <BannerNote>Note: if not applicable put NA or None.</BannerNote>

        <TextField
          label="Present Address"
          required
          value={state.presentAddress}
          onChange={(value) => patch({ presentAddress: value })}
        />
        <TextField
          label="Permanent Address"
          required
          value={state.permanentAddress}
          onChange={(value) => patch({ permanentAddress: value })}
        />

        <FieldGrid>
          <TextField
            label="Phone No."
            required
            inputMode="tel"
            value={state.phoneNo}
            onChange={(value) => patch({ phoneNo: value })}
          />
          <TextField
            label="Landline No."
            inputMode="tel"
            value={state.landlineNo}
            onChange={(value) => patch({ landlineNo: value })}
          />
          <TextField
            label="Other Contact No."
            inputMode="tel"
            value={state.otherContactNo}
            onChange={(value) => patch({ otherContactNo: value })}
          />
        </FieldGrid>

        <FieldGrid>
          <SelectField
            label="Civil Status"
            required
            options={civilStatusOptions}
            value={state.civilStatus}
            onChange={(value) => patch({ civilStatus: value })}
          />
          <SelectField
            label="No. of Dependent/s"
            required
            options={dependentsOptions}
            value={state.noOfDependents}
            onChange={(value) => patch({ noOfDependents: value })}
          />
          <SelectField
            label="Occupation"
            required
            options={occupationOptions}
            value={state.occupation}
            onChange={(value) => patch({ occupation: value })}
          />
        </FieldGrid>

        <FieldGrid>
          <TextField
            label="Employer"
            placeholder="if employed"
            value={state.employer}
            onChange={(value) => patch({ employer: value })}
          />
          <TextField
            label="Monthly Salary"
            inputMode="decimal"
            value={state.monthlySalary}
            onChange={(value) => patch({ monthlySalary: value })}
          />
          <SelectField
            label="Employment Status"
            options={employmentStatusOptions}
            value={state.employmentStatus}
            onChange={(value) => patch({ employmentStatus: value })}
          />
        </FieldGrid>

        <FieldGrid>
          <TextField
            label="Other Monthly Income"
            inputMode="decimal"
            value={state.otherMonthlyIncome}
            onChange={(value) => patch({ otherMonthlyIncome: value })}
          />
          <TextField
            label="Tax Identification Number"
            value={state.taxIdentificationNumber}
            onChange={(value) => patch({ taxIdentificationNumber: value })}
          />
          <TextField
            label="Spouse Name"
            value={state.spouseName}
            onChange={(value) => patch({ spouseName: value })}
          />
        </FieldGrid>

        <FieldGrid>
          <SelectField
            label="Valid ID"
            required
            options={validIdOptions}
            value={state.validId}
            onChange={(value) => patch({ validId: value })}
          />
          <TextField
            label="ID Number"
            required
            value={state.idNumber}
            onChange={(value) => patch({ idNumber: value })}
          />
        </FieldGrid>

        <FieldGrid>
          <TextField
            label="Share Capital as of (date)"
            type="date"
            value={state.shareCapitalAsOf}
            onChange={(value) => patch({ shareCapitalAsOf: value })}
          />
          <TextField
            label="Share Capital Amount"
            inputMode="decimal"
            value={state.shareCapitalAmount}
            onChange={(value) => patch({ shareCapitalAmount: value })}
          />
        </FieldGrid>
      </section>

      <section className="grid gap-4">
        <SectionHeading>ID Verification</SectionHeading>
        <BannerNote>
          Write your signature on white paper, take a photo, crop, then upload. Upload your
          government ID front and back. Accepts .jpeg, .jpg, .png up to 20MB each.
        </BannerNote>
        <FieldGrid>
          <FileField
            label="Signature"
            required
            fileName={files.signature?.name ?? null}
            onSelect={(file) => setFile("signature", file)}
          />
          <FileField
            label="ID Front Side"
            required
            fileName={files.idFront?.name ?? null}
            onSelect={(file) => setFile("idFront", file)}
          />
          <FileField
            label="ID Back Side"
            required
            fileName={files.idBack?.name ?? null}
            onSelect={(file) => setFile("idBack", file)}
          />
        </FieldGrid>
      </section>

      {message ? <p className="text-sm font-medium text-[#8f1f16]">{message}</p> : null}

      <Button onClick={onSubmit} disabled={isSubmitting} className="justify-self-start">
        <Send aria-hidden size={18} />
        {isSubmitting ? "Submitting..." : "Submit co-maker form"}
      </Button>
    </div>
  );
}
