import { jsonError } from "@/lib/server/http";
import { getMemberLoanApplication } from "@/features/loans/data";
import { generateLoanApplicationPdf } from "@/lib/server/loan-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await params;

  // getMemberLoanApplication enforces ownership (RLS + member_id filter); a
  // non-owner or signed-out user simply gets null -> 404.
  const application = await getMemberLoanApplication(loanId);
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
