import { CheckCircle2, ShieldAlert } from "@/components/ui/icon";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoMakerCompletionForm } from "@/features/loans/co-maker-completion-form";

export const metadata = {
  title: "Co-Maker Form"
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#F1F5F9] px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 border-b border-[#E2E8F0] pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#3673FC]">BMPC Portal</p>
          <h1 className="mt-1 text-xl font-semibold text-[#0F172A]">Loan Co-Maker Form</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

export default async function CoMakerPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (token.length < 24 || token.length > 128) {
    return (
      <Frame>
        <Notice
          tone="error"
          title="Invalid link"
          text="This co-maker link is not valid. Please ask the applicant to re-send your invite."
        />
      </Frame>
    );
  }

  const admin = createAdminClient();
  const { data: coMaker } = await admin
    .from("loan_co_makers")
    .select("id, first_name, last_name, invite_status, loan_application_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!coMaker) {
    return (
      <Frame>
        <Notice
          tone="error"
          title="Invalid link"
          text="This co-maker link is not valid. Please ask the applicant to re-send your invite."
        />
      </Frame>
    );
  }

  if (coMaker.invite_status === "completed") {
    return (
      <Frame>
        <Notice
          tone="success"
          title="Already submitted"
          text="You have already completed this co-maker form. No further action is needed."
        />
      </Frame>
    );
  }

  const { data: application } = await admin
    .from("loan_applications")
    .select("application_number, applicant_first_name, applicant_last_name")
    .eq("id", coMaker.loan_application_id)
    .maybeSingle();

  const applicantName = [application?.applicant_first_name, application?.applicant_last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Frame>
      <p className="mb-6 rounded-md bg-[#DAE7FF] px-4 py-3 text-sm text-[#1933B4]">
        Hello <strong>{coMaker.first_name} {coMaker.last_name}</strong>, you have been named as a
        co-maker
        {applicantName ? (
          <>
            {" "}for <strong>{applicantName}</strong>&apos;s loan application
          </>
        ) : null}
        {application?.application_number ? ` (${application.application_number})` : ""}. Please
        complete your details and upload your signature and valid ID below.
      </p>
      <CoMakerCompletionForm token={token} />
    </Frame>
  );
}

function Notice({
  tone,
  title,
  text
}: {
  tone: "success" | "error";
  title: string;
  text: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : ShieldAlert;
  const classes =
    tone === "success"
      ? "border-[#BDD6FF] bg-[#DAE7FF] text-[#1F52F1]"
      : "border-[#f3c6c0] bg-[#fdecea] text-[#8f1f16]";
  return (
    <div className={`flex items-start gap-3 rounded-md border p-5 ${classes}`}>
      <Icon aria-hidden size={22} className="mt-0.5 shrink-0" />
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm">{text}</p>
      </div>
    </div>
  );
}
