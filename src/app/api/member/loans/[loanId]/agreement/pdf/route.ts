import { jsonError } from "@/lib/server/http";
import { getMemberLoanApplication, getMemberLoanAgreement } from "@/features/loans/data";
import { generateLoanAgreementPdf } from "@/lib/server/loan-agreement-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await params;
  const application = await getMemberLoanApplication(loanId);
  if (!application) return jsonError("Loan application was not found.", 404);

  const agreement = await getMemberLoanAgreement(loanId);
  if (!agreement) return jsonError("No agreement found for this application.", 404);

  const { bytes, fileName } = await generateLoanAgreementPdf(application, agreement);
  return new Response(bytes as BlobPart, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
