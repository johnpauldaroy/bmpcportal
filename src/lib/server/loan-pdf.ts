import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LoanApplicationWithDetails } from "@/features/loans/data";
import {
  buildLoanFormFields,
  securityOfferedValues,
  type LoanFormFields,
  type PersonFields
} from "./loan-pdf-fields";
import coords from "./pdf/loan-form-coords.json";

/**
 * Generates the filled BMPC Loan Application Form as a PDF.
 *
 * If a blank official template exists at
 *   public/templates/loan-application-form.pdf
 * the data is *overlaid* onto it at the coordinates in TEMPLATE_COORDS for a
 * pixel-perfect match. Until that template is supplied, it falls back to a
 * cleanly rendered layout so the download feature works immediately.
 *
 * COORDINATE TUNING: pdf-lib's origin (0,0) is the BOTTOM-LEFT of the page.
 * Coordinates below are placeholders; once the real blank template is in place
 * they get measured against it (e.g. with a ruler overlay) and adjusted here —
 * no other file needs to change.
 */

const TEMPLATE_PATH = path.join(process.cwd(), "public", "templates", "loan-application-form.pdf");

const INK = rgb(0.06, 0.09, 0.16);
const FONT_SIZE = 8;

type Pt = [number, number];

// Coordinate JSON values are number[] at the type level; this narrows them to Pt.
type PtGroup = Record<string, number[]>;
const grp = (g: unknown) => g as PtGroup;

function drawAt(
  page: PDFPage,
  font: PDFFont,
  text: string,
  pt: number[] | null | undefined,
  size = FONT_SIZE
) {
  if (!pt || pt.length < 2 || !text) return;
  page.drawText(text, { x: pt[0], y: pt[1], size, font, color: INK });
}

async function loadTemplate(): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(TEMPLATE_PATH));
  } catch {
    return null;
  }
}

/** Stamp a person block (applicant or co-maker) using its coordinate group. */
function drawPerson(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  person: PersonFields,
  group: PtGroup
) {
  drawAt(page, font, person.firstName, group.firstName);
  drawAt(page, font, person.lastName, group.lastName);
  drawAt(page, font, person.middleName, group.middleName);
  drawAt(page, font, person.occupation, group.occupation);
  drawAt(page, font, person.monthlySalary, group.monthlySalary);
  drawAt(page, font, person.employer, group.employer);
  drawAt(page, font, person.totalMonthlyIncome, group.totalMonthlyIncome);
  drawAt(page, font, person.civilStatus, group.civilStatus);
  drawAt(page, font, person.spouseName, group.spouseName);
  drawAt(page, font, person.noOfDependents, group.noOfDependents);
  drawAt(page, font, person.spouseEmployer, group.spouseEmployer);
  drawAt(page, font, person.spouseMonthlySalary, group.spouseMonthlySalary);
  drawAt(page, font, person.presentAddress, group.presentAddress);
  drawAt(page, font, person.permanentAddress, group.permanentAddress);
  drawAt(page, font, person.phoneNo, group.phoneNo);
  drawAt(page, font, person.email, group.email);
  drawAt(page, font, person.taxIdentificationNumber, group.taxIdentificationNumber);
  drawAt(page, font, person.validId, group.validId);
  drawAt(page, font, person.idNumber, group.idNumber);
  const sc = [person.shareCapitalAsOf, person.shareCapitalAmount ? `₱ ${person.shareCapitalAmount}` : ""]
    .filter(Boolean)
    .join("  —  ");
  drawAt(page, font, sc, group.shareCapital);

  // Employment status tick (checkboxes are shared per row; offset from applicant
  // row using the same block delta as the text fields).
  const empBoxes = grp(coords.page1.employmentCheckboxes);
  const tickKey = person.employmentStatus?.toLowerCase();
  if (tickKey && empBoxes[tickKey] && group.occupation) {
    // Employment boxes sit on the Employer row; align y with this block's occupation row minus one row (~13pt).
    const [bx] = empBoxes[tickKey];
    const by = group.occupation[1] - 13;
    drawAt(page, fontBold, "X", [bx, by], 9);
  }
}

/** Overlay path: stamp values onto the official blank template. */
async function renderOverlay(template: Uint8Array, fields: LoanFormFields): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(template);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const page1 = pages[0];
  const page2 = pages[1] ?? page1;

  const c = coords.page1;
  const terms = grp(c.terms);

  // Loan terms
  drawAt(page1, font, fields.amountInWords, terms.amountInWords);
  drawAt(page1, font, fields.amountRequested, terms.amountRequested);
  drawAt(page1, font, fields.preferredTermMonths, terms.preferredTermMonths);
  drawAt(page1, font, fields.firstPaymentDue, terms.firstPaymentDue);
  drawAt(page1, font, fields.purpose, terms.purpose);

  // Loan-type checkbox
  const loanBoxes = grp(c.loanTypeCheckboxes);
  drawAt(page1, fontBold, "X", loanBoxes[fields.loanType], 9);
  if (fields.othersSpecify && loanBoxes.others) {
    drawAt(page1, font, fields.othersSpecify, [loanBoxes.others[0] + 95, loanBoxes.others[1]]);
  }

  // Security offered checkboxes
  const secBoxes = grp(c.securityCheckboxes);
  for (const sec of securityOfferedValues) {
    if (fields.securityOffered.includes(sec)) {
      drawAt(page1, fontBold, "X", secBoxes[sec], 9);
    }
  }

  // Person blocks
  drawPerson(page1, font, fontBold, fields.applicant, grp(c.applicant));
  if (fields.coMaker1) drawPerson(page1, font, fontBold, fields.coMaker1, grp(c.coMaker1));
  if (fields.coMaker2) drawPerson(page1, font, fontBold, fields.coMaker2, grp(c.coMaker2));

  // Page-2 signature name lines
  const sig = grp(coords.page2.sig);
  drawAt(page2, font, fields.memberBorrowerName, sig.memberBorrowerName, 9);
  drawAt(page2, font, fields.coMaker1Name, sig.coMaker1Name, 9);
  drawAt(page2, font, fields.coMaker2Name, sig.coMaker2Name, 9);

  return pdf.save();
}

// ---- Fallback clean-layout renderer (used until template is supplied) ----

function personRows(p: PersonFields): Array<[string, string]> {
  return [
    ["Name", [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ")],
    ["Occupation", p.occupation],
    ["Monthly Salary", p.monthlySalary ? `₱ ${p.monthlySalary}` : ""],
    ["Employer", p.employer],
    ["Employment Status", p.employmentStatus],
    ["Total Monthly Income", p.totalMonthlyIncome ? `₱ ${p.totalMonthlyIncome}` : ""],
    ["Civil Status", p.civilStatus],
    ["Spouse Name", p.spouseName],
    ["No. of Dependents", p.noOfDependents],
    ["Present Address", p.presentAddress],
    ["Permanent Address", p.permanentAddress],
    ["Phone / Cellphone", p.phoneNo],
    ["Email", p.email],
    ["TIN", p.taxIdentificationNumber],
    ["Valid ID", p.validId],
    ["ID Number", p.idNumber],
    ["Share Capital As Of", p.shareCapitalAsOf],
    ["Share Capital Amount", p.shareCapitalAmount ? `₱ ${p.shareCapitalAmount}` : ""]
  ];
}

async function renderClean(fields: LoanFormFields): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const A4: [number, number] = [595.28, 841.89];
  const margin = 48;

  let page = pdf.addPage(A4);
  let y = A4[1] - margin;

  const heading = (text: string) => {
    if (y < margin + 40) {
      page = pdf.addPage(A4);
      y = A4[1] - margin;
    }
    y -= 6;
    page.drawText(text, { x: margin, y, size: 11, font: bold, color: INK });
    y -= 16;
  };
  const row = (labelText: string, value: string) => {
    if (!value) return;
    if (y < margin + 16) {
      page = pdf.addPage(A4);
      y = A4[1] - margin;
    }
    page.drawText(`${labelText}:`, { x: margin, y, size: 9, font: bold, color: INK });
    page.drawText(value, { x: margin + 130, y, size: 9, font, color: INK, maxWidth: A4[0] - margin * 2 - 130 });
    y -= 14;
  };

  page.drawText("BARBAZA MULTI-PURPOSE COOPERATIVE", { x: margin, y, size: 14, font: bold, color: INK });
  y -= 18;
  page.drawText(`LOAN APPLICATION FORM  •  ${fields.applicationNumber}`, { x: margin, y, size: 10, font, color: INK });
  y -= 24;

  heading("LOAN DETAILS");
  row("Branch", fields.branch);
  row("Date", fields.date);
  row("Loan Type", fields.loanTypeLabel);
  row("Amount", `${fields.amountInWords}  (₱ ${fields.amountRequested})`);
  row("Term", fields.preferredTermMonths ? `${fields.preferredTermMonths} months` : "");
  row("First Payment Due", fields.firstPaymentDue);
  row("Purpose", fields.purpose);
  row(
    "Security Offered",
    fields.securityOffered
      .map((v) => securityOfferedValues.includes(v) ? v.replace(/_/g, " ") : v)
      .join(", ")
  );

  heading("APPLICANT'S STATEMENT");
  for (const [k, v] of personRows(fields.applicant)) row(k, v);

  if (fields.coMaker1) {
    heading("CO-MAKER 1 STATEMENT");
    for (const [k, v] of personRows(fields.coMaker1)) row(k, v);
  }
  if (fields.coMaker2) {
    heading("CO-MAKER 2 STATEMENT");
    for (const [k, v] of personRows(fields.coMaker2)) row(k, v);
  }

  const allProps = [
    ...fields.applicantProperties.map((p) => ["Applicant", p] as const),
    ...fields.coMaker1Properties.map((p) => ["Co-Maker 1", p] as const),
    ...fields.coMaker2Properties.map((p) => ["Co-Maker 2", p] as const)
  ];
  if (allProps.length) {
    heading("REAL PROPERTY OWNED");
    for (const [owner, p] of allProps) {
      row(
        owner,
        [p.description, p.landTitleNumber, p.lotNumber, p.location, p.lotAreaSqm ? `${p.lotAreaSqm} sqm` : ""]
          .filter(Boolean)
          .join(" · ")
      );
    }
  }

  return pdf.save();
}

export async function generateLoanApplicationPdf(
  application: LoanApplicationWithDetails
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const fields = buildLoanFormFields(application);
  const template = await loadTemplate();
  const bytes = template ? await renderOverlay(template, fields) : await renderClean(fields);
  const safeNumber = application.application_number.replace(/[^A-Za-z0-9_-]/g, "");
  return { bytes, fileName: `loan-application-${safeNumber}.pdf` };
}
