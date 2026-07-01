# Loan application PDF template

Drop the **blank** official BMPC loan application form here as:

    loan-application-form.pdf

When this file is present, the loan PDF download
(`/api/admin/loans/[id]/pdf` and `/api/member/loans/[id]/pdf`) **overlays** the
applicant's data onto the official form at the coordinates defined in
`src/lib/server/loan-pdf.ts` (`TEMPLATE_COORDS` / `CHECKBOX_COORDS`).

When this file is **absent**, the download still works but produces a
cleanly-rendered fallback layout (same data, generic styling) so the feature is
never broken.

## After adding the template
The coordinates in `loan-pdf.ts` are placeholders and must be tuned against the
real template (pdf-lib's origin is the bottom-left of the page). Ping Claude to
measure and set the exact field positions.

# Loan agreement PDF templates

Drop the **blank** official BMPC agreement forms here as:

    promissory-note.pdf
    pledge-of-deposits.pdf
    authority-to-deduct.pdf

When a file is present, the loan agreement download
(`/api/admin/loans/[id]/agreement/pdf` and the member equivalent) **overlays**
the borrower/loan data onto that official form at the coordinates defined in:

    src/lib/server/pdf/promissory-note-coords.json
    src/lib/server/pdf/pledge-of-deposits-coords.json
    src/lib/server/pdf/authority-to-deduct-coords.json

When a file is **absent**, that section falls back to a cleanly-rendered layout
(same data, generic styling) so the download is never broken. The Disclosure
Statement and Discount Sheet always use the clean render (no official template).

## After adding these templates
The coordinate JSONs are **seeded** and must be tuned against the real forms
(pdf-lib's origin is the bottom-left of the page). Ping Claude to measure and set
the exact field positions per form.
