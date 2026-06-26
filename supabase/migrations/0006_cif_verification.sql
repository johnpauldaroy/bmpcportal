-- CIF verification records table.
-- Admins pre-populate this with member CIF keys and branch assignments.
-- Registration verifies against this table before creating an account.

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.cif_records (
  id uuid primary key default gen_random_uuid(),
  cif_key text not null unique,
  member_number text not null unique,
  branch_id uuid not null references public.branches(id) on delete restrict,
  is_claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for fast lookup during registration verification
create index cif_records_cif_key_idx on public.cif_records(cif_key);
create index cif_records_member_number_idx on public.cif_records(member_number);

-- RLS: only admins/staff can manage these tables; no direct member access
alter table public.branches enable row level security;
alter table public.cif_records enable row level security;

create policy "staff and admins manage branches"
  on public.branches for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "staff and admins manage cif records"
  on public.cif_records for all
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- Seed branches
insert into public.branches (code, name) values
  ('MAIN', 'Main Branch'),
  ('NORTH', 'North Branch'),
  ('SOUTH', 'South Branch'),
  ('EAST', 'East Branch'),
  ('WEST', 'West Branch');
