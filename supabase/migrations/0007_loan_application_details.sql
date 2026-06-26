-- Full BMPC loan application capture.
-- Extends loan_applications with the applicant/spouse/employment/branch detail
-- captured by the public online form, and adds normalized child tables for
-- co-makers, real property, and uploaded attachments. Replaces the slim
-- submit_loan_application RPC with one that accepts the complete payload and
-- writes all rows transactionally.

-- Enum types (idempotent: skip if a prior run already created them).
do $$
begin
  create type public.loan_security_kind as enum (
    'savings_time_deposits',
    'real_estate',
    'chattel',
    'jewelry',
    'none'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.loan_property_kind as enum (
    'residential',
    'commercial',
    'industrial',
    'agricultural'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.loan_co_maker_role as enum ('first', 'second');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.loan_co_maker_status as enum ('invited', 'completed', 'declined');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.loan_attachment_kind as enum (
    'applicant_signature',
    'applicant_id_front',
    'applicant_id_back',
    'spouse_signature',
    'spouse_id_front',
    'spouse_id_back',
    'first_co_maker_signature',
    'first_co_maker_id_front',
    'first_co_maker_id_back',
    'second_co_maker_signature',
    'second_co_maker_id_front',
    'second_co_maker_id_back'
  );
exception when duplicate_object then null;
end $$;

-- Loan information + applicant statement fields.
alter table public.loan_applications
  add column if not exists loan_type text,
  add column if not exists loan_type_other text,
  add column if not exists security_offered public.loan_security_kind[] not null default '{}',
  add column if not exists amount_in_words text,
  add column if not exists first_payment_due date,
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists applicant_first_name text,
  add column if not exists applicant_last_name text,
  add column if not exists applicant_middle_name text,
  add column if not exists present_address text,
  add column if not exists permanent_address text,
  add column if not exists phone_no text,
  add column if not exists landline_no text,
  add column if not exists other_contact_no text,
  add column if not exists applicant_email text,
  add column if not exists civil_status text,
  add column if not exists no_of_dependents integer,
  add column if not exists occupation text,
  add column if not exists employer text,
  add column if not exists monthly_salary numeric(14, 2),
  add column if not exists employment_status text,
  add column if not exists other_monthly_income numeric(14, 2),
  add column if not exists tax_identification_number text,
  add column if not exists valid_id text,
  add column if not exists id_number text,
  add column if not exists spouse_name text,
  add column if not exists spouse_employer text,
  add column if not exists spouse_monthly_salary numeric(14, 2),
  add column if not exists share_capital_as_of date,
  add column if not exists share_capital_amount numeric(14, 2);

comment on column public.loan_applications.loan_type is
  'Loan applied for, e.g. multi_purpose, salary, faxcom, honorarium, medap, pension, enhanced_educational, others.';
comment on column public.loan_applications.security_offered is
  'One or more securities offered against the loan.';

-- These three child tables are new in this migration and hold no production
-- data yet, so drop any partial version from an earlier run to guarantee the
-- shape matches the definitions below. Remove these drops once 0007 has shipped.
drop table if exists public.loan_attachments cascade;
drop table if exists public.loan_real_properties cascade;
drop table if exists public.loan_co_makers cascade;

-- Co-makers are invited by the applicant, who enters only the contact details
-- below. The co-maker then completes the rest of their own statement (and
-- uploads their signature + ID) through a tokenized public link.
create table if not exists public.loan_co_makers (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  co_maker_role public.loan_co_maker_role not null,
  -- Provided by the applicant at submission time.
  first_name text not null,
  last_name text not null,
  middle_name text,
  contact_no text,
  email text not null,
  -- Invite tracking.
  invite_token text not null unique,
  invite_status public.loan_co_maker_status not null default 'invited',
  invited_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Self-filled by the co-maker through the public link.
  present_address text,
  permanent_address text,
  phone_no text,
  landline_no text,
  other_contact_no text,
  civil_status text,
  no_of_dependents integer,
  occupation text,
  employer text,
  monthly_salary numeric(14, 2),
  employment_status text,
  other_monthly_income numeric(14, 2),
  tax_identification_number text,
  valid_id text,
  id_number text,
  spouse_name text,
  share_capital_as_of date,
  share_capital_amount numeric(14, 2),
  created_at timestamptz not null default now(),
  unique (loan_application_id, co_maker_role)
);

create index if not exists loan_co_makers_application_idx
  on public.loan_co_makers (loan_application_id);
create index if not exists loan_co_makers_invite_token_idx
  on public.loan_co_makers (invite_token);

create table if not exists public.loan_real_properties (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  -- 'applicant', 'first_co_maker', 'second_co_maker'
  owner_role text not null default 'applicant',
  description public.loan_property_kind,
  land_title_number text,
  lot_number text,
  location text,
  lot_area_sqm numeric(14, 2),
  created_at timestamptz not null default now()
);

create index if not exists loan_real_properties_application_idx
  on public.loan_real_properties (loan_application_id);

create table if not exists public.loan_attachments (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  kind public.loan_attachment_kind not null,
  bucket_id text not null default 'loan-attachments',
  storage_path text not null,
  file_name text,
  content_type text,
  byte_size bigint,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (loan_application_id, kind)
);

create index if not exists loan_attachments_application_idx
  on public.loan_attachments (loan_application_id);

alter table public.loan_co_makers enable row level security;
alter table public.loan_real_properties enable row level security;
alter table public.loan_attachments enable row level security;

-- Members can read their own child rows; staff/admin manage everything.
-- Drops first so the migration is safe to re-run.
drop policy if exists "loan_co_makers_member_select_own" on public.loan_co_makers;
create policy "loan_co_makers_member_select_own" on public.loan_co_makers
  for select to authenticated
  using (public.member_owns_loan(loan_application_id));

drop policy if exists "loan_co_makers_staff_manage_all" on public.loan_co_makers;
create policy "loan_co_makers_staff_manage_all" on public.loan_co_makers
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "loan_real_properties_member_select_own" on public.loan_real_properties;
create policy "loan_real_properties_member_select_own" on public.loan_real_properties
  for select to authenticated
  using (public.member_owns_loan(loan_application_id));

drop policy if exists "loan_real_properties_staff_manage_all" on public.loan_real_properties;
create policy "loan_real_properties_staff_manage_all" on public.loan_real_properties
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "loan_attachments_member_select_own" on public.loan_attachments;
create policy "loan_attachments_member_select_own" on public.loan_attachments
  for select to authenticated
  using (public.member_owns_loan(loan_application_id));

drop policy if exists "loan_attachments_staff_manage_all" on public.loan_attachments;
create policy "loan_attachments_staff_manage_all" on public.loan_attachments
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- Rich submission RPC. Child collections arrive as jsonb arrays so the whole
-- application is written atomically and members cannot forge other members'
-- rows (everything is keyed to p_actor_id).
create or replace function public.submit_loan_application(
  p_actor_id uuid,
  p_product_id uuid,
  p_amount_requested numeric,
  p_preferred_term_months integer,
  p_purpose text,
  p_details jsonb default '{}'::jsonb,
  p_co_makers jsonb default '[]'::jsonb,
  p_real_properties jsonb default '[]'::jsonb,
  p_attachments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
-- `extensions` is on the path so the unqualified gen_random_bytes (pgcrypto,
-- installed in the extensions schema on Supabase) resolves for the invite token.
set search_path = public, extensions
as $$
declare
  v_profile public.profiles%rowtype;
  v_product public.loan_products%rowtype;
  v_application public.loan_applications%rowtype;
  v_security public.loan_security_kind[];
  v_co_maker jsonb;
  v_property jsonb;
  v_attachment jsonb;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_actor_id;

  if not found or v_profile.role <> 'member' then
    return jsonb_build_object('ok', false, 'error', 'A member profile is required.');
  end if;

  if v_profile.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Only active members can submit loan applications.');
  end if;

  select *
  into v_product
  from public.loan_products
  where id = p_product_id
    and is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Loan product is not available.');
  end if;

  if p_amount_requested < v_product.min_amount or p_amount_requested > v_product.max_amount then
    return jsonb_build_object(
      'ok', false,
      'error', format('Amount must be between %s and %s.', v_product.min_amount, v_product.max_amount)
    );
  end if;

  if p_preferred_term_months < v_product.min_term_months
    or p_preferred_term_months > v_product.max_term_months then
    return jsonb_build_object(
      'ok', false,
      'error', format('Term must be between %s and %s months.', v_product.min_term_months, v_product.max_term_months)
    );
  end if;

  -- Coerce the security_offered string array into the enum array.
  select coalesce(array_agg(value::public.loan_security_kind), '{}')
  into v_security
  from jsonb_array_elements_text(coalesce(p_details -> 'security_offered', '[]'::jsonb)) as value;

  insert into public.loan_applications (
    member_id,
    product_id,
    amount_requested,
    preferred_term_months,
    purpose,
    status,
    created_by,
    loan_type,
    loan_type_other,
    security_offered,
    amount_in_words,
    first_payment_due,
    branch_id,
    applicant_first_name,
    applicant_last_name,
    applicant_middle_name,
    present_address,
    permanent_address,
    phone_no,
    landline_no,
    other_contact_no,
    applicant_email,
    civil_status,
    no_of_dependents,
    occupation,
    employer,
    monthly_salary,
    employment_status,
    other_monthly_income,
    tax_identification_number,
    valid_id,
    id_number,
    spouse_name,
    spouse_employer,
    spouse_monthly_salary,
    share_capital_as_of,
    share_capital_amount
  )
  values (
    p_actor_id,
    p_product_id,
    p_amount_requested,
    p_preferred_term_months,
    p_purpose,
    'submitted',
    p_actor_id,
    p_details ->> 'loan_type',
    p_details ->> 'loan_type_other',
    v_security,
    p_details ->> 'amount_in_words',
    (p_details ->> 'first_payment_due')::date,
    (p_details ->> 'branch_id')::uuid,
    p_details ->> 'applicant_first_name',
    p_details ->> 'applicant_last_name',
    p_details ->> 'applicant_middle_name',
    p_details ->> 'present_address',
    p_details ->> 'permanent_address',
    p_details ->> 'phone_no',
    p_details ->> 'landline_no',
    p_details ->> 'other_contact_no',
    p_details ->> 'applicant_email',
    p_details ->> 'civil_status',
    nullif(p_details ->> 'no_of_dependents', '')::integer,
    p_details ->> 'occupation',
    p_details ->> 'employer',
    nullif(p_details ->> 'monthly_salary', '')::numeric,
    p_details ->> 'employment_status',
    nullif(p_details ->> 'other_monthly_income', '')::numeric,
    p_details ->> 'tax_identification_number',
    p_details ->> 'valid_id',
    p_details ->> 'id_number',
    p_details ->> 'spouse_name',
    p_details ->> 'spouse_employer',
    nullif(p_details ->> 'spouse_monthly_salary', '')::numeric,
    nullif(p_details ->> 'share_capital_as_of', '')::date,
    nullif(p_details ->> 'share_capital_amount', '')::numeric
  )
  returning *
  into v_application;

  -- Insert co-maker invites only; the co-maker fills the rest via their link.
  for v_co_maker in select * from jsonb_array_elements(coalesce(p_co_makers, '[]'::jsonb))
  loop
    insert into public.loan_co_makers (
      loan_application_id,
      co_maker_role,
      first_name,
      last_name,
      middle_name,
      contact_no,
      email,
      invite_token,
      invite_status
    )
    values (
      v_application.id,
      (v_co_maker ->> 'co_maker_role')::public.loan_co_maker_role,
      v_co_maker ->> 'first_name',
      v_co_maker ->> 'last_name',
      v_co_maker ->> 'middle_name',
      v_co_maker ->> 'contact_no',
      v_co_maker ->> 'email',
      encode(gen_random_bytes(24), 'hex'),
      'invited'
    );
  end loop;

  for v_property in select * from jsonb_array_elements(coalesce(p_real_properties, '[]'::jsonb))
  loop
    insert into public.loan_real_properties (
      loan_application_id,
      owner_role,
      description,
      land_title_number,
      lot_number,
      location,
      lot_area_sqm
    )
    values (
      v_application.id,
      coalesce(v_property ->> 'owner_role', 'applicant'),
      nullif(v_property ->> 'description', '')::public.loan_property_kind,
      v_property ->> 'land_title_number',
      v_property ->> 'lot_number',
      v_property ->> 'location',
      nullif(v_property ->> 'lot_area_sqm', '')::numeric
    );
  end loop;

  for v_attachment in select * from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb))
  loop
    insert into public.loan_attachments (
      loan_application_id,
      kind,
      bucket_id,
      storage_path,
      file_name,
      content_type,
      byte_size,
      created_by
    )
    values (
      v_application.id,
      (v_attachment ->> 'kind')::public.loan_attachment_kind,
      coalesce(v_attachment ->> 'bucket_id', 'loan-attachments'),
      v_attachment ->> 'storage_path',
      v_attachment ->> 'file_name',
      v_attachment ->> 'content_type',
      nullif(v_attachment ->> 'byte_size', '')::bigint,
      p_actor_id
    );
  end loop;

  insert into public.loan_status_history (
    loan_application_id,
    previous_status,
    status,
    note,
    changed_by
  )
  values (
    v_application.id,
    null,
    'submitted',
    'Submitted by member.',
    p_actor_id
  );

  insert into public.audit_logs (
    actor_id,
    actor_role,
    action,
    target_table,
    target_id,
    severity,
    metadata
  )
  values (
    p_actor_id,
    v_profile.role,
    'loan.application_submitted',
    'loan_applications',
    v_application.id,
    'info',
    jsonb_build_object(
      'application_number', v_application.application_number,
      'product_id', p_product_id,
      'amount_requested', p_amount_requested,
      'preferred_term_months', p_preferred_term_months,
      'loan_type', v_application.loan_type
    )
  );

  return jsonb_build_object(
    'ok', true,
    'application_id', v_application.id,
    'application_number', v_application.application_number,
    'status', v_application.status,
    'co_maker_invites', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', cm.id,
            'co_maker_role', cm.co_maker_role,
            'first_name', cm.first_name,
            'last_name', cm.last_name,
            'email', cm.email,
            'invite_token', cm.invite_token
          )
          order by cm.co_maker_role
        )
        from public.loan_co_makers cm
        where cm.loan_application_id = v_application.id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.submit_loan_application(
  uuid, uuid, numeric, integer, text, jsonb, jsonb, jsonb, jsonb
) to authenticated;

-- Completes a co-maker's own statement + attachments via their invite token.
-- Called server-side with the service role after the public route validates the
-- token, so it is intentionally not granted to anon/authenticated roles.
create or replace function public.complete_co_maker(
  p_invite_token text,
  p_details jsonb default '{}'::jsonb,
  p_attachments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_maker public.loan_co_makers%rowtype;
  v_attachment jsonb;
begin
  select *
  into v_co_maker
  from public.loan_co_makers
  where invite_token = p_invite_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'This invite link is invalid.');
  end if;

  if v_co_maker.invite_status = 'completed' then
    return jsonb_build_object('ok', false, 'error', 'This co-maker form was already submitted.');
  end if;

  update public.loan_co_makers
  set present_address = p_details ->> 'present_address',
      permanent_address = p_details ->> 'permanent_address',
      phone_no = p_details ->> 'phone_no',
      landline_no = p_details ->> 'landline_no',
      other_contact_no = p_details ->> 'other_contact_no',
      civil_status = p_details ->> 'civil_status',
      no_of_dependents = nullif(p_details ->> 'no_of_dependents', '')::integer,
      occupation = p_details ->> 'occupation',
      employer = p_details ->> 'employer',
      monthly_salary = nullif(p_details ->> 'monthly_salary', '')::numeric,
      employment_status = p_details ->> 'employment_status',
      other_monthly_income = nullif(p_details ->> 'other_monthly_income', '')::numeric,
      tax_identification_number = p_details ->> 'tax_identification_number',
      valid_id = p_details ->> 'valid_id',
      id_number = p_details ->> 'id_number',
      spouse_name = p_details ->> 'spouse_name',
      share_capital_as_of = nullif(p_details ->> 'share_capital_as_of', '')::date,
      share_capital_amount = nullif(p_details ->> 'share_capital_amount', '')::numeric,
      invite_status = 'completed',
      completed_at = now()
  where id = v_co_maker.id;

  -- Replace any prior attachments for this co-maker role, then insert fresh.
  for v_attachment in select * from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb))
  loop
    insert into public.loan_attachments (
      loan_application_id,
      kind,
      bucket_id,
      storage_path,
      file_name,
      content_type,
      byte_size
    )
    values (
      v_co_maker.loan_application_id,
      (v_attachment ->> 'kind')::public.loan_attachment_kind,
      coalesce(v_attachment ->> 'bucket_id', 'loan-attachments'),
      v_attachment ->> 'storage_path',
      v_attachment ->> 'file_name',
      v_attachment ->> 'content_type',
      nullif(v_attachment ->> 'byte_size', '')::bigint
    )
    on conflict (loan_application_id, kind)
    do update set storage_path = excluded.storage_path,
                  file_name = excluded.file_name,
                  content_type = excluded.content_type,
                  byte_size = excluded.byte_size;
  end loop;

  insert into public.audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    severity,
    metadata
  )
  values (
    null,
    'loan.co_maker_completed',
    'loan_co_makers',
    v_co_maker.id,
    'info',
    jsonb_build_object(
      'loan_application_id', v_co_maker.loan_application_id,
      'co_maker_role', v_co_maker.co_maker_role
    )
  );

  return jsonb_build_object('ok', true, 'co_maker_id', v_co_maker.id);
end;
$$;

-- Loan products now represent the BMPC "Loan Applied For" categories so the
-- application form can present them in a single dropdown. Retire the generic
-- scaffold products and upsert the real loan types.
update public.loan_products set is_active = false where code in ('REGULAR', 'EMERGENCY');

insert into public.loan_products (
  code, name, description, min_amount, max_amount, min_term_months, max_term_months, interest_rate_percent
)
values
  ('MULTI_PURPOSE', 'Multi-Purpose Loan', 'Multi-purpose member loan.', 1000, 1000000, 1, 60, null),
  ('SALARY', 'Salary Loan', 'Loan against salary.', 1000, 1000000, 1, 60, null),
  ('FAXCOM', 'FAXCOM Loan', 'FAXCOM loan facility.', 1000, 1000000, 1, 60, null),
  ('HONORARIUM', 'Honorarium Loan', 'Honorarium-based loan.', 1000, 1000000, 1, 60, null),
  ('MEDAP', 'MEDAP', 'Medical assistance program loan.', 1000, 1000000, 1, 60, null),
  ('PENSION', 'Pension Loan', 'Loan against pension.', 1000, 1000000, 1, 60, null),
  ('ENHANCED_EDUCATIONAL', 'Enhanced Educational Loan', 'Educational support loan.', 1000, 1000000, 1, 60, null),
  ('OTHERS', 'Others', 'Other loan type (specify purpose).', 1000, 1000000, 1, 60, null)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    min_amount = excluded.min_amount,
    max_amount = excluded.max_amount,
    min_term_months = excluded.min_term_months,
    max_term_months = excluded.max_term_months,
    is_active = true,
    updated_at = now();

-- Members need to read active branches to pick one on the loan form. The only
-- branches policy (0006) is staff/admin-only, which left the dropdown empty for
-- members. Add a read policy scoped to active branches.
drop policy if exists "branches_authenticated_select_active" on public.branches;
create policy "branches_authenticated_select_active" on public.branches
  for select to authenticated
  using (is_active = true);

-- Real BMPC branches for the loan application's Branch dropdown.
-- Retire the scaffold branches from 0006 and seed the actual ones.
update public.branches set is_active = false
  where code in ('MAIN', 'NORTH', 'SOUTH', 'EAST', 'WEST');

insert into public.branches (code, name) values
  ('BARBAZA', 'Barbaza'),
  ('CULASI', 'Culasi'),
  ('SIBALOM', 'Sibalom'),
  ('SAN_JOSE', 'San Jose'),
  ('BALASAN', 'Balasan'),
  ('BAROTAC', 'Barotac'),
  ('CATICLAN', 'Caticlan'),
  ('MOLO', 'Molo'),
  ('KALIBO', 'Kalibo'),
  ('JANIUAY', 'Janiuay'),
  ('CALINOG', 'Calinog')
on conflict (code) do update
set name = excluded.name,
    is_active = true;
