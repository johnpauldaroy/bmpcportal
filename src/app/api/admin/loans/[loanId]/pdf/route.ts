import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError } from "@/lib/server/http";
import { getAdminLoanApplication } from "@/features/loans/data";
import { generateLoanApplicationPdf } from "@/lib/server/loan-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { loanId } = await params;
  const application = await getAdminLoanApplication(loanId);
  if (!application) {
    return jsonError("Loan application was not found.", 404);
  }

  const { bytes, fileName } = await generateLoanApplicationPdf(application);
  return new Response(bytes as BlobPart, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
