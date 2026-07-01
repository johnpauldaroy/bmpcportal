-- Loan agreement workflow: staff prepare disclosure/discount/promissory terms,
-- send the agreement to the maker, who reviews and e-signs to accept.

-- Lifecycle of the agreement itself (separate from the loan_status).
do $$ begin
  create type public.loan_agreement_status as enum ('draft', 'sent', 'accepted', 'declined', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.loan_agreements (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null unique
    references public.loan_applications(id) on delete cascade,
  status public.loan_agreement_status not null default 'draft',

  -- ===== Financial terms (entered by staff) =====
  amount_of_loan numeric(14, 2) not null,
  loan_retention_percent numeric(7, 4),
  loan_retention_amount numeric(14, 2),
  service_fee_percent numeric(7, 4),
  service_fee_amount numeric(14, 2),
  filing_fee numeric(14, 2) not null default 30,
  -- Free-form additional deductions: [{ label, amount }]
  other_deductions jsonb not null default '[]'::jsonb,
  total_deduction numeric(14, 2),
  net_loan_proceeds numeric(14, 2),

  -- Discount sheet / promissory terms.
  type_of_loan text,
  purpose_of_loan text,
  term_months integer,
  interest_rate_percent numeric(7, 4),
  security text,
  monthly_amortization numeric(14, 2),
  loan_date date,
  maturity_date date,
  first_payment_due date,

  -- Salary-deduction breakdown (authority to deduct).
  amort_breakdown jsonb not null default '{}'::jsonb,

  -- ===== Maker acceptance =====
  sent_at timestamptz,
  sent_by uuid references public.profiles(id),
  accepted_at timestamptz,
  -- Signature stored in the loan-attachments bucket (data captured client-side).
  maker_signature_bucket text,
  maker_signature_path text,
  maker_acknowledged boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loan_agreements_application_idx
  on public.loan_agreements (loan_application_id);

-- Keep updated_at fresh.
create or replace function public.touch_loan_agreement_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_loan_agreements_touch on public.loan_agreements;
create trigger trg_loan_agreements_touch
  before update on public.loan_agreements
  for each row execute function public.touch_loan_agreement_updated_at();

-- ===== RLS =====
alter table public.loan_agreements enable row level security;

-- Members can read the agreement for their own application and update only the
-- acceptance fields (enforced in the API; RLS gates row visibility).
drop policy if exists loan_agreements_member_select on public.loan_agreements;
create policy loan_agreements_member_select on public.loan_agreements
  for select using (
    exists (
      select 1 from public.loan_applications la
      where la.id = loan_agreements.loan_application_id
        and la.member_id = auth.uid()
    )
  );

-- Members may update the acceptance fields on their own sent agreement. Column-
-- level restriction is enforced in the API; RLS restricts which rows + requires
-- the agreement to have been sent.
drop policy if exists loan_agreements_member_update on public.loan_agreements;
create policy loan_agreements_member_update on public.loan_agreements
  for update to authenticated
  using (
    status = 'sent'
    and exists (
      select 1 from public.loan_applications la
      where la.id = loan_agreements.loan_application_id
        and la.member_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.loan_applications la
      where la.id = loan_agreements.loan_application_id
        and la.member_id = auth.uid()
    )
  );

-- Staff/admin full access (mirrors loan_applications staff policy pattern).
drop policy if exists loan_agreements_staff_all on public.loan_agreements;
create policy loan_agreements_staff_all on public.loan_agreements
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
