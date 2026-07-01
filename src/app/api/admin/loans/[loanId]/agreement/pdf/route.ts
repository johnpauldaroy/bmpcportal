import { getAdminLoanAgreement, getAdminLoanApplication } from "@/features/loans/data";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { generateLoanAgreementPdf } from "@/lib/server/loan-agreement-pdf";
import { jsonError } from "@/lib/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const { loanId } = await params;
  const application = await getAdminLoanApplication(loanId);
  if (!application) return jsonError("Loan application was not found.", 404);

  const agreement = await getAdminLoanAgreement(loanId);
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
