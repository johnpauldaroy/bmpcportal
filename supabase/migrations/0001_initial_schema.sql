-- BMPC Portal core schema for Supabase PostgreSQL.
-- Covers auth profiles, CSV financial snapshots, loans, insurance, mortuary,
-- notifications, digital documents, loyalty, referrals, AI knowledge base,
-- audit logs, private storage buckets, indexes, foreign keys, and RLS policies.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('member', 'staff', 'admin');
create type public.member_status as enum ('pending', 'active', 'inactive', 'suspended', 'closed');
create type public.snapshot_type as enum ('savings', 'share_capital');
create type public.import_status as enum ('draft', 'previewed', 'committed', 'failed', 'cancelled');
create type public.import_row_status as enum ('valid', 'invalid', 'committed', 'skipped');
create type public.loan_status as enum ('draft', 'submitted', 'under_review', 'needs_more_info', 'approved', 'released', 'rejected', 'cancelled');
create type public.attachment_kind as enum ('loan_requirement', 'insurance_document', 'mortuary_document', 'knowledge_document', 'generated_document');
create type public.coverage_status as enum ('active', 'expiring', 'expired', 'cancelled');
create type public.mortuary_status as enum ('active', 'inactive', 'claim_pending', 'claimed', 'cancelled');
create type public.claim_status as enum ('draft', 'submitted', 'under_review', 'approved', 'released', 'rejected', 'cancelled');
create type public.notification_channel as enum ('in_app', 'push', 'email', 'sms');
create type public.notification_status as enum ('queued', 'sent', 'read', 'failed', 'cancelled');
create type public.document_status as enum ('draft', 'issued', 'revoked', 'expired');
create type public.points_entry_type as enum ('earn', 'redeem', 'adjustment', 'reversal', 'expiry');
create type public.redemption_status as enum ('requested', 'approved', 'released', 'rejected', 'cancelled');
create type public.referral_status as enum ('created', 'invited', 'registered', 'verified', 'rewarded', 'cancelled');
create type public.knowledge_sync_status as enum ('pending', 'uploading', 'synced', 'failed', 'archived');
create type public.ai_message_role as enum ('user', 'assistant', 'system');
create type public.audit_severity as enum ('info', 'warning', 'critical');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_number text unique,
  role public.user_role not null default 'member',
  status public.member_status not null default 'pending',
  full_name text not null,
  email text,
  phone text,
  address text,
  date_of_birth date,
  avatar_path text,
  last_seen_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_member_number_required_for_members check (
    role <> 'member' or member_number is not null
  )
);

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('staff', 'admin'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.profiles(id) on delete cascade,
  membership_date date,
  occupation text,
  employer text,
  emergency_contact_name text,
  emergency_contact_phone text,
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  qr_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.user_role,
  action text not null,
  target_table text,
  target_id uuid,
  severity public.audit_severity not null default 'info',
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);

create table public.snapshot_imports (
  id uuid primary key default gen_random_uuid(),
  type public.snapshot_type not null,
  effective_date date not null,
  status public.import_status not null default 'draft',
  source_file_path text,
  source_file_name text,
  source_file_hash text not null,
  row_count integer not null default 0 check (row_count >= 0),
  valid_row_count integer not null default 0 check (valid_row_count >= 0),
  invalid_row_count integer not null default 0 check (invalid_row_count >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  error_summary jsonb not null default '{}',
  imported_by uuid references public.profiles(id) on delete set null,
  committed_by uuid references public.profiles(id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, effective_date, source_file_hash)
);

create table public.snapshot_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.snapshot_imports(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  member_number text,
  member_id uuid references public.profiles(id) on delete set null,
  amount numeric(14,2),
  effective_date date,
  status public.import_row_status not null default 'valid',
  errors jsonb not null default '[]',
  raw_row jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (import_id, row_number)
);

create table public.member_financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.snapshot_imports(id) on delete restrict,
  import_row_id uuid references public.snapshot_import_rows(id) on delete set null,
  member_id uuid not null references public.profiles(id) on delete cascade,
  type public.snapshot_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  effective_date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, type, effective_date)
);

create table public.loan_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  min_amount numeric(14,2) not null default 0 check (min_amount >= 0),
  max_amount numeric(14,2) not null check (max_amount > 0),
  min_term_months integer not null default 1 check (min_term_months > 0),
  max_term_months integer not null check (max_term_months > 0),
  interest_rate_percent numeric(7,4),
  required_documents jsonb not null default '[]',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_products_amount_range check (max_amount >= min_amount),
  constraint loan_products_term_range check (max_term_months >= min_term_months)
);

create table public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.loan_products(id) on delete restrict,
  application_number text not null unique default ('LN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  amount_requested numeric(14,2) not null check (amount_requested > 0),
  preferred_term_months integer not null check (preferred_term_months > 0),
  purpose text not null,
  status public.loan_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  decision_note text,
  released_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loan_status_history (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  previous_status public.loan_status,
  status public.loan_status not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  owner_member_id uuid references public.profiles(id) on delete cascade,
  related_table text,
  related_id uuid,
  kind public.attachment_kind not null,
  bucket_id text not null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  checksum text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

create table public.insurance_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  description text,
  default_coverage_months integer check (default_coverage_months is null or default_coverage_months > 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.insurance_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.insurance_products(id) on delete set null,
  policy_number text,
  provider text,
  coverage_amount numeric(14,2) check (coverage_amount is null or coverage_amount >= 0),
  premium_amount numeric(14,2) check (premium_amount is null or premium_amount >= 0),
  effective_date date not null,
  expiry_date date not null,
  status public.coverage_status not null default 'active',
  metadata jsonb not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insurance_date_range check (expiry_date >= effective_date)
);

create table public.insurance_reminders (
  id uuid primary key default gen_random_uuid(),
  insurance_record_id uuid not null references public.insurance_records(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  remind_on date not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (insurance_record_id, remind_on)
);

create table public.mortuary_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  status public.mortuary_status not null default 'active',
  effective_date date,
  beneficiary_name text,
  beneficiary_relationship text,
  beneficiary_contact text,
  contribution_amount numeric(14,2) check (contribution_amount is null or contribution_amount >= 0),
  claim_ready_data jsonb not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mortuary_claims (
  id uuid primary key default gen_random_uuid(),
  mortuary_record_id uuid not null references public.mortuary_records(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  claimant_name text not null,
  claimant_contact text,
  status public.claim_status not null default 'submitted',
  claim_amount numeric(14,2) check (claim_amount is null or claim_amount >= 0),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  decision_note text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  member_id uuid references public.profiles(id) on delete cascade,
  related_table text,
  related_id uuid,
  payload jsonb not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.notification_events(id) on delete set null,
  member_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'queued',
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.membership_ids (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.profiles(id) on delete cascade,
  qr_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status public.document_status not null default 'issued',
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  storage_path text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qr_verification_events (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references public.membership_ids(id) on delete set null,
  qr_token text not null,
  verified boolean not null default false,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.share_certificates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  certificate_number text not null unique,
  threshold_number integer not null check (threshold_number > 0),
  share_capital_amount numeric(14,2) not null check (share_capital_amount >= 0),
  based_on_snapshot_id uuid references public.member_financial_snapshots(id) on delete set null,
  status public.document_status not null default 'issued',
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  storage_path text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, threshold_number)
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  entry_type public.points_entry_type not null,
  points integer not null check (points <> 0),
  balance_after integer,
  reason text not null,
  reference_table text,
  reference_id uuid,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.rewards_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  inventory_count integer check (inventory_count is null or inventory_count >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rewards_date_range check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards_catalog(id) on delete restrict,
  redemption_number text not null unique default ('RW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  points_cost integer not null check (points_cost > 0),
  status public.redemption_status not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  fulfilled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_redemption_history (
  id uuid primary key default gen_random_uuid(),
  redemption_id uuid not null references public.reward_redemptions(id) on delete cascade,
  previous_status public.redemption_status,
  status public.redemption_status not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_member_id uuid not null references public.profiles(id) on delete cascade,
  referred_profile_id uuid references public.profiles(id) on delete set null,
  referral_code text not null,
  status public.referral_status not null default 'created',
  invited_name text,
  invited_contact text,
  verified_at timestamptz,
  reward_points_awarded integer not null default 0 check (reward_points_awarded >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_status_history (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  previous_status public.referral_status,
  status public.referral_status not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null unique,
  content_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  checksum text,
  openai_file_id text,
  vector_store_id text,
  sync_status public.knowledge_sync_status not null default 'pending',
  sync_error text,
  synced_at timestamptz,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  knowledge_document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  status public.knowledge_sync_status not null default 'pending',
  openai_file_id text,
  vector_store_id text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  citations jsonb not null default '[]',
  model text,
  refused boolean not null default false,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger member_profiles_set_updated_at before update on public.member_profiles
  for each row execute function public.set_updated_at();
create trigger snapshot_imports_set_updated_at before update on public.snapshot_imports
  for each row execute function public.set_updated_at();
create trigger loan_products_set_updated_at before update on public.loan_products
  for each row execute function public.set_updated_at();
create trigger loan_applications_set_updated_at before update on public.loan_applications
  for each row execute function public.set_updated_at();
create trigger insurance_products_set_updated_at before update on public.insurance_products
  for each row execute function public.set_updated_at();
create trigger insurance_records_set_updated_at before update on public.insurance_records
  for each row execute function public.set_updated_at();
create trigger mortuary_records_set_updated_at before update on public.mortuary_records
  for each row execute function public.set_updated_at();
create trigger mortuary_claims_set_updated_at before update on public.mortuary_claims
  for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();
create trigger membership_ids_set_updated_at before update on public.membership_ids
  for each row execute function public.set_updated_at();
create trigger share_certificates_set_updated_at before update on public.share_certificates
  for each row execute function public.set_updated_at();
create trigger rewards_catalog_set_updated_at before update on public.rewards_catalog
  for each row execute function public.set_updated_at();
create trigger reward_redemptions_set_updated_at before update on public.reward_redemptions
  for each row execute function public.set_updated_at();
create trigger referrals_set_updated_at before update on public.referrals
  for each row execute function public.set_updated_at();
create trigger knowledge_documents_set_updated_at before update on public.knowledge_documents
  for each row execute function public.set_updated_at();
create trigger ai_conversations_set_updated_at before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create index profiles_role_status_idx on public.profiles(role, status);
create index profiles_member_number_idx on public.profiles(member_number);
create index member_profiles_member_id_idx on public.member_profiles(member_id);
create index member_profiles_referral_code_idx on public.member_profiles(referral_code);
create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_target_idx on public.audit_logs(target_table, target_id, created_at desc);
create index audit_logs_action_created_idx on public.audit_logs(action, created_at desc);
create index snapshot_imports_type_effective_idx on public.snapshot_imports(type, effective_date desc);
create index snapshot_imports_status_created_idx on public.snapshot_imports(status, created_at desc);
create index snapshot_import_rows_import_status_idx on public.snapshot_import_rows(import_id, status);
create index snapshot_import_rows_member_number_idx on public.snapshot_import_rows(member_number);
create index financial_snapshots_member_type_effective_idx on public.member_financial_snapshots(member_id, type, effective_date desc);
create index financial_snapshots_import_idx on public.member_financial_snapshots(import_id);
create index loan_products_active_idx on public.loan_products(is_active);
create index loan_applications_member_status_idx on public.loan_applications(member_id, status);
create index loan_applications_status_created_idx on public.loan_applications(status, created_at desc);
create index loan_status_history_application_created_idx on public.loan_status_history(loan_application_id, created_at);
create index file_attachments_owner_idx on public.file_attachments(owner_member_id, created_at desc);
create index file_attachments_related_idx on public.file_attachments(related_table, related_id);
create index insurance_records_member_expiry_idx on public.insurance_records(member_id, expiry_date);
create index insurance_records_status_expiry_idx on public.insurance_records(status, expiry_date);
create index insurance_reminders_remind_on_idx on public.insurance_reminders(remind_on, sent_at);
create index mortuary_records_member_status_idx on public.mortuary_records(member_id, status);
create index mortuary_claims_member_status_idx on public.mortuary_claims(member_id, status);
create index notification_events_member_created_idx on public.notification_events(member_id, created_at desc);
create index notifications_member_created_idx on public.notifications(member_id, created_at desc);
create index notifications_status_scheduled_idx on public.notifications(status, scheduled_for);
create index membership_ids_member_status_idx on public.membership_ids(member_id, status);
create index qr_verification_events_token_created_idx on public.qr_verification_events(qr_token, created_at desc);
create index share_certificates_member_status_idx on public.share_certificates(member_id, status);
create index points_ledger_member_created_idx on public.points_ledger(member_id, created_at desc);
create index points_ledger_reference_idx on public.points_ledger(reference_table, reference_id);
create index rewards_catalog_active_idx on public.rewards_catalog(is_active);
create index reward_redemptions_member_status_idx on public.reward_redemptions(member_id, status);
create index reward_redemption_history_redemption_idx on public.reward_redemption_history(redemption_id, created_at);
create index referrals_referrer_status_idx on public.referrals(referrer_member_id, status);
create index referrals_referred_profile_idx on public.referrals(referred_profile_id);
create index referral_status_history_referral_idx on public.referral_status_history(referral_id, created_at);
create index knowledge_documents_status_idx on public.knowledge_documents(sync_status, created_at desc);
create index knowledge_sync_jobs_document_status_idx on public.knowledge_sync_jobs(knowledge_document_id, status);
create index ai_conversations_member_created_idx on public.ai_conversations(member_id, created_at desc);
create index ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.member_profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.snapshot_imports enable row level security;
alter table public.snapshot_import_rows enable row level security;
alter table public.member_financial_snapshots enable row level security;
alter table public.loan_products enable row level security;
alter table public.loan_applications enable row level security;
alter table public.loan_status_history enable row level security;
alter table public.file_attachments enable row level security;
alter table public.insurance_products enable row level security;
alter table public.insurance_records enable row level security;
alter table public.insurance_reminders enable row level security;
alter table public.mortuary_records enable row level security;
alter table public.mortuary_claims enable row level security;
alter table public.notification_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.membership_ids enable row level security;
alter table public.qr_verification_events enable row level security;
alter table public.share_certificates enable row level security;
alter table public.points_ledger enable row level security;
alter table public.rewards_catalog enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.reward_redemption_history enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_status_history enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_sync_jobs enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff_or_admin());
create policy "profiles_update_own_basic" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_staff_all" on public.profiles
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "member_profiles_select_own_or_staff" on public.member_profiles
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "member_profiles_staff_all" on public.member_profiles
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "audit_logs_staff_select" on public.audit_logs
  for select to authenticated using (public.is_staff_or_admin());
create policy "audit_logs_staff_insert" on public.audit_logs
  for insert to authenticated with check (public.is_staff_or_admin() or actor_id = auth.uid());

create policy "snapshot_imports_staff_all" on public.snapshot_imports
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "snapshot_import_rows_staff_all" on public.snapshot_import_rows
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "financial_snapshots_select_own_or_staff" on public.member_financial_snapshots
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "financial_snapshots_staff_insert" on public.member_financial_snapshots
  for insert to authenticated with check (public.is_staff_or_admin());

create policy "loan_products_select_authenticated" on public.loan_products
  for select to authenticated using (is_active or public.is_staff_or_admin());
create policy "loan_products_staff_all" on public.loan_products
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "loan_applications_select_own_or_staff" on public.loan_applications
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "loan_applications_member_insert" on public.loan_applications
  for insert to authenticated with check (member_id = auth.uid());
create policy "loan_applications_staff_update" on public.loan_applications
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "loan_status_history_select_related" on public.loan_status_history
  for select to authenticated using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.loan_applications app
      where app.id = loan_application_id and app.member_id = auth.uid()
    )
  );
create policy "loan_status_history_staff_insert" on public.loan_status_history
  for insert to authenticated with check (public.is_staff_or_admin());

create policy "file_attachments_select_owner_or_staff" on public.file_attachments
  for select to authenticated using (owner_member_id = auth.uid() or public.is_staff_or_admin());
create policy "file_attachments_insert_owner_or_staff" on public.file_attachments
  for insert to authenticated with check (owner_member_id = auth.uid() or public.is_staff_or_admin());

create policy "insurance_products_select_authenticated" on public.insurance_products
  for select to authenticated using (is_active or public.is_staff_or_admin());
create policy "insurance_products_staff_all" on public.insurance_products
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "insurance_records_select_own_or_staff" on public.insurance_records
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "insurance_records_staff_all" on public.insurance_records
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "insurance_reminders_select_own_or_staff" on public.insurance_reminders
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "insurance_reminders_staff_all" on public.insurance_reminders
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "mortuary_records_select_own_or_staff" on public.mortuary_records
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "mortuary_records_staff_all" on public.mortuary_records
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "mortuary_claims_select_own_or_staff" on public.mortuary_claims
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "mortuary_claims_staff_all" on public.mortuary_claims
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "notification_events_staff_all" on public.notification_events
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "notifications_select_own_or_staff" on public.notifications
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "notifications_member_update_read" on public.notifications
  for update to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy "notifications_staff_all" on public.notifications
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "notification_preferences_owner_or_staff" on public.notification_preferences
  for all to authenticated using (member_id = auth.uid() or public.is_staff_or_admin()) with check (member_id = auth.uid() or public.is_staff_or_admin());

create policy "membership_ids_select_own_or_staff" on public.membership_ids
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "membership_ids_staff_all" on public.membership_ids
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "qr_verification_events_staff_select" on public.qr_verification_events
  for select to authenticated using (public.is_staff_or_admin());
create policy "share_certificates_select_own_or_staff" on public.share_certificates
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "share_certificates_staff_all" on public.share_certificates
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "points_ledger_select_own_or_staff" on public.points_ledger
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "points_ledger_staff_insert" on public.points_ledger
  for insert to authenticated with check (public.is_staff_or_admin());
create policy "rewards_catalog_select_active" on public.rewards_catalog
  for select to authenticated using (is_active or public.is_staff_or_admin());
create policy "rewards_catalog_staff_all" on public.rewards_catalog
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "reward_redemptions_select_own_or_staff" on public.reward_redemptions
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "reward_redemptions_member_insert" on public.reward_redemptions
  for insert to authenticated with check (member_id = auth.uid());
create policy "reward_redemptions_staff_update" on public.reward_redemptions
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "reward_history_select_related" on public.reward_redemption_history
  for select to authenticated using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.reward_redemptions rr
      where rr.id = redemption_id and rr.member_id = auth.uid()
    )
  );
create policy "reward_history_staff_insert" on public.reward_redemption_history
  for insert to authenticated with check (public.is_staff_or_admin());

create policy "referrals_select_related_or_staff" on public.referrals
  for select to authenticated using (
    referrer_member_id = auth.uid()
    or referred_profile_id = auth.uid()
    or public.is_staff_or_admin()
  );
create policy "referrals_member_insert" on public.referrals
  for insert to authenticated with check (referrer_member_id = auth.uid());
create policy "referrals_staff_update" on public.referrals
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "referral_history_select_related" on public.referral_status_history
  for select to authenticated using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.referrals r
      where r.id = referral_id
      and (r.referrer_member_id = auth.uid() or r.referred_profile_id = auth.uid())
    )
  );
create policy "referral_history_staff_insert" on public.referral_status_history
  for insert to authenticated with check (public.is_staff_or_admin());

create policy "knowledge_documents_staff_all" on public.knowledge_documents
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "knowledge_sync_jobs_staff_all" on public.knowledge_sync_jobs
  for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "ai_conversations_select_own" on public.ai_conversations
  for select to authenticated using (member_id = auth.uid() or public.is_staff_or_admin());
create policy "ai_conversations_insert_own" on public.ai_conversations
  for insert to authenticated with check (member_id = auth.uid() or member_id is null);
create policy "ai_messages_select_related" on public.ai_messages
  for select to authenticated using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.member_id = auth.uid()
    )
  );
create policy "ai_messages_insert_related" on public.ai_messages
  for insert to authenticated with check (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.member_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('loan-attachments', 'loan-attachments', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('insurance-documents', 'insurance-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('mortuary-documents', 'mortuary-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('share-certificates', 'share-certificates', false, 5242880, array['application/pdf']),
  ('membership-ids', 'membership-ids', false, 5242880, array['application/pdf', 'image/png']),
  ('csv-imports', 'csv-imports', false, 5242880, array['text/csv', 'application/vnd.ms-excel']),
  ('knowledge-documents', 'knowledge-documents', false, 52428800, array['application/pdf', 'text/plain', 'text/markdown'])
on conflict (id) do nothing;

-- Storage object RLS is intentionally not created in this schema migration.
-- Hosted Supabase can reject CREATE POLICY on storage.objects from SQL Editor:
--   ERROR: 42501: must be owner of relation objects
-- Apply storage object policies with supabase/storage-policies.sql through
-- the Storage dashboard policy UI or an owner-capable migration context.
