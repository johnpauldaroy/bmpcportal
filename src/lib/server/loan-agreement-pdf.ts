import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LoanAgreement, LoanApplicationWithDetails } from "@/features/loans/data";
import { buildAgreementFormFields, type AgreementFormFields } from "./loan-agreement-pdf-fields";
import pledgeCoords from "./pdf/pledge-of-deposits-coords.json";
import authorityCoords from "./pdf/authority-to-deduct-coords.json";
import promissoryCoords from "./pdf/promissory-note-coords.json";

/**
 * Generates the maker's loan agreement packet as a PDF: Disclosure Statement,
 * Discount Sheet, Promissory Note, Pledge of Deposits, and Authority to Deduct.
 *
 * The official BMPC forms (Promissory Note, Pledge of Deposits, Authority to
 * Deduct) are pixel-matched by OVERLAYING the borrower/loan data onto the blank
 * templates under public/templates/ at the coordinates in src/lib/server/pdf/*.
 * When a template is missing, that section falls back to a clean from-scratch
 * render so the download never breaks.
 *
 * COORDINATE TUNING: pdf-lib's origin (0,0) is the BOTTOM-LEFT of the page. The
 * coordinate JSONs are seeded and must be measured against the real templates.
 */

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.28, 0.33, 0.41);
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 50;

const TEMPLATES = {
  promissory: path.join(process.cwd(), "public", "templates", "promissory-note.pdf"),
  pledge: path.join(process.cwd(), "public", "templates", "pledge-of-deposits.pdf"),
  authority: path.join(process.cwd(), "public", "templates", "authority-to-deduct.pdf")
};

async function loadTemplate(file: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(file));
  } catch {
    return null;
  }
}

function peso(v: number | string | null | undefined): string {
  if (v == null || v === "") return "0.00";
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n)
    ? "0.00"
    : new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fdate(v: string | null | undefined): string {
  if (!v) return "________________";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ---- Overlay helpers ----

type Pt = number[] | null | undefined;
type PtGroup = Record<string, number[]>;

function stamp(page: PDFPage, font: PDFFont, text: string, pt: Pt, size = 9) {
  if (!pt || pt.length < 2 || !text) return;
  page.drawText(text, { x: pt[0], y: pt[1], size, font, color: INK });
}

/** Overlay the Promissory Note onto its official template. */
function overlayPromissory(template: PDFDocument, font: PDFFont, f: AgreementFormFields) {
  const page = template.getPages()[0];
  const c = promissoryCoords.fields as PtGroup;
  const s = promissoryCoords.signatures as PtGroup;
  stamp(page, font, f.amount ? `Php ${f.amount}` : "", c.amount);
  stamp(page, font, f.promissoryNoteNo, c.promissoryNoteNo);
  stamp(page, font, f.loanDate, c.loanDate);
  stamp(page, font, f.maturityDate, c.maturityDate);
  stamp(page, font, f.amountWords, c.sumWords);
  stamp(page, font, f.amount, c.sumAmount);
  stamp(page, font, f.interestRate, c.interestRate);
  stamp(page, font, f.amountWords, c.installmentWords);
  stamp(page, font, f.monthlyAmortization, c.installmentAmount);
  stamp(page, font, f.firstPaymentDue, c.firstPayment);
  stamp(page, font, f.borrowerName, s.maker, 8);
  stamp(page, font, f.coMakerNames[0] ?? "", s.coMaker1, 8);
  stamp(page, font, f.coMakerNames[1] ?? "", s.coMaker2, 8);
  stamp(page, font, f.spouseName, s.spouse, 8);
}

/** Overlay the Pledge of Deposits onto its official template. */
function overlayPledge(template: PDFDocument, font: PDFFont, f: AgreementFormFields) {
  const page = template.getPages()[0];
  const c = pledgeCoords.fields as PtGroup;
  const s = pledgeCoords.signatures as PtGroup;
  stamp(page, font, f.loanDate, c.noteDate);
  stamp(page, font, f.amountWords, c.amountWords);
  stamp(page, font, f.amount, c.amount);
  stamp(page, font, f.amountWords, c.authorityAmountWords);
  stamp(page, font, f.amount, c.authorityAmount);
  stamp(page, font, f.borrowerName, s.maker, 8);
  stamp(page, font, f.coMakerNames[0] ?? "", s.coMaker1, 8);
  stamp(page, font, f.coMakerNames[1] ?? "", s.coMaker2, 8);
  stamp(page, font, f.coMakerNames[2] ?? "", s.coMaker3, 8);
  stamp(page, font, f.coMakerNames[3] ?? "", s.coMaker4, 8);
}

/** Overlay the Authority to Deduct onto its official template. */
function overlayAuthority(template: PDFDocument, font: PDFFont, f: AgreementFormFields) {
  const page = template.getPages()[0];
  const b = authorityCoords.borrower as PtGroup;
  const cm = authorityCoords.coMaker as PtGroup;
  const s = authorityCoords.signatures as PtGroup;

  // Left column — principal borrower
  stamp(page, font, f.amountWords, b.amountWords);
  stamp(page, font, f.amount, b.amount);
  stamp(page, font, f.monthlyAmortization ? f.amountWords : "", b.deductAmountWords);
  stamp(page, font, f.monthlyAmortization, b.deductAmount);
  stamp(page, font, f.firstPaymentDue, b.firstPayment);
  stamp(page, font, f.loanAmortization, b.loanAmortization);
  stamp(page, font, f.interest, b.interest);
  stamp(page, font, f.fines, b.fines);
  stamp(page, font, f.capitalBuildUp, b.capitalBuildUp);
  stamp(page, font, f.savingsDeposit, b.savingsDeposit);
  stamp(page, font, f.totalDeduction, b.total);

  // Right column — co-makers
  stamp(page, font, f.borrowerName, cm.grantedTo);
  stamp(page, font, f.amountWords, cm.amountWords);
  stamp(page, font, f.amount, cm.amount);
  stamp(page, font, f.amountWords, cm.deductAmountWords);
  stamp(page, font, f.monthlyAmortization, cm.deductAmount);
  stamp(page, font, f.borrowerName, cm.loanAmortizationOf);

  stamp(page, font, f.borrowerName, s.borrower, 8);
  stamp(page, font, f.coMakerNames[0] ?? "", s.coMaker1, 8);
  stamp(page, font, f.coMakerNames[1] ?? "", s.coMaker2, 8);
}

/** Copy every page of an overlaid template into the output document. */
async function appendTemplate(out: PDFDocument, template: PDFDocument) {
  const copied = await out.copyPages(template, template.getPageIndices());
  for (const p of copied) out.addPage(p);
}

// ---- Clean-render fallback (used per form when its template is missing) ----

type Ctx = {
  pdf: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

function newPageIfNeeded(ctx: Ctx, needed = 60) {
  if (ctx.y < MARGIN + needed) {
    ctx.page = ctx.pdf.addPage(A4);
    ctx.y = A4[1] - MARGIN;
  }
}

function title(ctx: Ctx, text: string) {
  ctx.page = ctx.pdf.addPage(A4);
  ctx.y = A4[1] - MARGIN;
  ctx.page.drawText("BARBAZA MULTI-PURPOSE COOPERATIVE", {
    x: MARGIN, y: ctx.y, size: 12, font: ctx.bold, color: INK
  });
  ctx.y -= 18;
  ctx.page.drawText(text, { x: MARGIN, y: ctx.y, size: 13, font: ctx.bold, color: INK });
  ctx.y -= 22;
}

function row(ctx: Ctx, label: string, value: string, strong = false) {
  newPageIfNeeded(ctx);
  ctx.page.drawText(label, { x: MARGIN, y: ctx.y, size: 9, font: ctx.bold, color: MUTED });
  ctx.page.drawText(value, {
    x: MARGIN + 200, y: ctx.y, size: 9, font: strong ? ctx.bold : ctx.font, color: INK
  });
  ctx.y -= 15;
}

function para(ctx: Ctx, text: string) {
  newPageIfNeeded(ctx);
  const words = text.split(" ");
  const maxWidth = A4[0] - MARGIN * 2;
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.font.widthOfTextAtSize(test, 8.5) > maxWidth) {
      ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: 8.5, font: ctx.font, color: INK });
      ctx.y -= 12;
      newPageIfNeeded(ctx);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: 8.5, font: ctx.font, color: INK });
    ctx.y -= 16;
  }
}

function deductions(ctx: Ctx, ag: LoanAgreement) {
  row(ctx, "Amount of Loan", `Php ${peso(ag.amount_of_loan)}`, true);
  ctx.y -= 4;
  ctx.page.drawText("Less:", { x: MARGIN, y: ctx.y, size: 9, font: ctx.font, color: MUTED });
  ctx.y -= 15;
  if (ag.loan_retention_amount != null)
    row(ctx, `   Loan Retention ${ag.loan_retention_percent ?? ""}%`, `Php ${peso(ag.loan_retention_amount)}`);
  if (ag.service_fee_amount != null)
    row(ctx, `   Service Fee ${ag.service_fee_percent ?? ""}%`, `Php ${peso(ag.service_fee_amount)}`);
  row(ctx, "   Filing Fee", `Php ${peso(ag.filing_fee)}`);
  for (const d of ag.other_deductions ?? []) {
    row(ctx, `   ${d.label || "Others"}`, `Php ${peso(d.amount)}`);
  }
  row(ctx, "Total Deduction", `Php ${peso(ag.total_deduction)}`, true);
  row(ctx, "Net Loan Proceeds", `Php ${peso(ag.net_loan_proceeds)}`, true);
}

function signatureLine(ctx: Ctx, label: string) {
  newPageIfNeeded(ctx, 50);
  ctx.y -= 24;
  ctx.page.drawText("____________________________", { x: MARGIN, y: ctx.y, size: 9, font: ctx.font, color: INK });
  ctx.y -= 12;
  ctx.page.drawText(label, { x: MARGIN, y: ctx.y, size: 8, font: ctx.bold, color: MUTED });
  ctx.y -= 18;
}

function cleanPromissory(ctx: Ctx, app: LoanApplicationWithDetails, ag: LoanAgreement) {
  title(ctx, "PROMISSORY NOTE");
  row(ctx, "Amount of Loan", `Php ${peso(ag.amount_of_loan)}`, true);
  row(ctx, "Loan Date", fdate(ag.loan_date));
  row(ctx, "Maturity Date", fdate(ag.maturity_date));
  ctx.y -= 4;
  para(ctx, `For the value received, I/we, jointly and severally, promise to pay to Barbaza Multi-Purpose Cooperative, or its order, at its office, the sum of Php ${peso(ag.amount_of_loan)}, with interest at the rate of ${ag.interest_rate_percent ?? "____"} percent (%) per month, diminishing monthly; payable in monthly installments of Php ${peso(ag.monthly_amortization)} each, the first payment to be made on ${fdate(ag.first_payment_due)} and until the loan amount is fully paid.`);
  para(ctx, "In case of any default in the agreed payment schedule, Barbaza Multi-Purpose Cooperative is unconditionally entitled to declare all unpaid balance immediately due and payable. A penalty charge of three percent (3%) per month over the interest shall be charged on all delayed or unpaid installments.");
  signatureLine(ctx, "MAKER");
  for (const cm of app.coMakers) {
    signatureLine(ctx, `CO-MAKER - ${[cm.first_name, cm.middle_name, cm.last_name].filter(Boolean).join(" ")}`);
  }
}

function cleanPledge(ctx: Ctx, ag: LoanAgreement) {
  title(ctx, "PLEDGE OF DEPOSITS");
  para(ctx, `I/We, the undersigned, hereby pledge all deposits and payments on deposits which I/We now have or hereinafter may have in this Cooperative as security for the loan dated ${fdate(ag.loan_date)} in the amount of Php ${peso(ag.amount_of_loan)}, payable to Barbaza Multi-Purpose Cooperative.`);
  signatureLine(ctx, "MAKER");
}

function cleanAuthority(ctx: Ctx, ag: LoanAgreement) {
  title(ctx, "AUTHORITY TO DEDUCT FROM SALARY / WAGES");
  para(ctx, `In consideration of the loan granted to me by Barbaza Multi-Purpose Cooperative in the amount of Php ${peso(ag.amount_of_loan)}, I hereby authorize my employer's Cashier/Disbursing Officer to deduct from my salary every payday, as payment for my monthly obligations until the loan including its interests and penalties are fully paid.`);
  const ab = ag.amort_breakdown ?? {};
  row(ctx, "Loan Amortization", `Php ${peso(ab.loanAmortization)}`);
  row(ctx, "Interest", `Php ${peso(ab.interest)}`);
  row(ctx, "Fines, if any", `Php ${peso(ab.fines)}`);
  row(ctx, "Capital Build Up (CBU)", `Php ${peso(ab.capitalBuildUp)}`);
  row(ctx, "Savings Deposit", `Php ${peso(ab.savingsDeposit)}`);
  signatureLine(ctx, "Signature over Printed Name of Principal Borrower");
}

export async function generateLoanAgreementPdf(
  application: LoanApplicationWithDetails,
  agreement: LoanAgreement
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { pdf, font, bold, page: pdf.addPage(A4), y: 0 };
  const fields = buildAgreementFormFields(application, agreement);

  const borrower = fields.borrowerName;
  const address = fields.address;

  // ---- Disclosure Statement (clean render — no official template provided) ----
  ctx.page = pdf.getPages()[0];
  ctx.y = A4[1] - MARGIN;
  ctx.page.drawText("BARBAZA MULTI-PURPOSE COOPERATIVE", { x: MARGIN, y: ctx.y, size: 12, font: bold, color: INK });
  ctx.y -= 18;
  ctx.page.drawText("DISCLOSURE STATEMENT", { x: MARGIN, y: ctx.y, size: 13, font: bold, color: INK });
  ctx.y -= 20;
  para(ctx, "Pursuant to RA No. 3765 (Truth in Lending Act), Barbaza Multi-Purpose Cooperative hereby discloses fully the following terms and conditions of credit to the Borrower:");
  ctx.y -= 4;
  row(ctx, "Name of Borrower", borrower);
  row(ctx, "Address", address);
  ctx.y -= 4;
  deductions(ctx, agreement);
  signatureLine(ctx, "Name & Signature of Maker");

  // ---- Discount Sheet (clean render — no official template provided) ----
  title(ctx, "DISCOUNT SHEET");
  row(ctx, "Date", fdate(agreement.loan_date ?? application.created_at));
  row(ctx, "Name of Borrower", borrower);
  row(ctx, "Type of Loan", agreement.type_of_loan ?? application.product?.name ?? "");
  row(ctx, "Purpose of Loan", agreement.purpose_of_loan ?? "");
  row(ctx, "Term", agreement.term_months != null ? `${agreement.term_months} months` : "");
  row(ctx, "Interest Rate", agreement.interest_rate_percent != null ? `${agreement.interest_rate_percent}%` : "");
  row(ctx, "Security", agreement.security ?? "");
  ctx.y -= 4;
  deductions(ctx, agreement);
  signatureLine(ctx, "Borrower");

  // ---- Promissory Note (overlay official template, else clean render) ----
  const promissoryTpl = await loadTemplate(TEMPLATES.promissory);
  if (promissoryTpl) {
    const tpl = await PDFDocument.load(promissoryTpl);
    const tplFont = await tpl.embedFont(StandardFonts.Helvetica);
    overlayPromissory(tpl, tplFont, fields);
    await appendTemplate(pdf, tpl);
  } else {
    cleanPromissory(ctx, application, agreement);
  }

  // ---- Pledge of Deposits (overlay official template, else clean render) ----
  const pledgeTpl = await loadTemplate(TEMPLATES.pledge);
  if (pledgeTpl) {
    const tpl = await PDFDocument.load(pledgeTpl);
    const tplFont = await tpl.embedFont(StandardFonts.Helvetica);
    overlayPledge(tpl, tplFont, fields);
    await appendTemplate(pdf, tpl);
  } else {
    cleanPledge(ctx, agreement);
  }

  // ---- Authority to Deduct (overlay official template, else clean render) ----
  const authorityTpl = await loadTemplate(TEMPLATES.authority);
  if (authorityTpl) {
    const tpl = await PDFDocument.load(authorityTpl);
    const tplFont = await tpl.embedFont(StandardFonts.Helvetica);
    overlayAuthority(tpl, tplFont, fields);
    await appendTemplate(pdf, tpl);
  } else {
    cleanAuthority(ctx, agreement);
  }

  // Acceptance footer
  if (agreement.status === "accepted" && agreement.accepted_at) {
    const page = pdf.addPage(A4);
    page.drawText(
      `Electronically accepted by the maker on ${new Date(agreement.accepted_at).toLocaleString()}.`,
      { x: MARGIN, y: A4[1] - MARGIN, size: 8, font, color: MUTED }
    );
  }

  const bytes = await pdf.save();
  const safe = application.application_number.replace(/[^A-Za-z0-9_-]/g, "");
  return { bytes, fileName: `loan-agreement-${safe}.pdf` };
}
