-- BMPC Portal RLS policy layer.
-- This migration replaces the broad scaffold policies from 0001 with explicit
-- member-safe access and staff/admin-only operational policies.

create or replace function public.is_own_profile(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() = profile_id
$$;

create or replace function public.member_owns_loan(application_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.loan_applications app
    where app.id = application_id
      and app.member_id = auth.uid()
  )
$$;

create or replace function public.member_owns_reward_redemption(redemption_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.reward_redemptions redemption
    where redemption.id = redemption_id
      and redemption.member_id = auth.uid()
  )
$$;

create or replace function public.member_related_to_referral(referral_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.referrals referral
    where referral.id = referral_id
      and (
        referral.referrer_member_id = auth.uid()
        or referral.referred_profile_id = auth.uid()
      )
  )
$$;

create or replace function public.member_owns_ai_conversation(conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.ai_conversations conversation
    where conversation.id = conversation_id
      and conversation.member_id = auth.uid()
  )
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff_or_admin() then
    return new;
  end if;

  if new.id <> auth.uid() then
    raise exception 'Only staff can update another profile.';
  end if;

  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.member_number is distinct from old.member_number
    or new.created_by is distinct from old.created_by
    or new.updated_by is distinct from old.updated_by then
    raise exception 'Members cannot update role, status, member number, or audit ownership columns.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'member_profiles',
        'audit_logs',
        'snapshot_imports',
        'snapshot_import_rows',
        'member_financial_snapshots',
        'loan_products',
        'loan_applications',
        'loan_status_history',
        'file_attachments',
        'insurance_products',
        'insurance_records',
        'insurance_reminders',
        'mortuary_records',
        'mortuary_claims',
        'notification_events',
        'notifications',
        'notification_preferences',
        'membership_ids',
        'qr_verification_events',
        'share_certificates',
        'points_ledger',
        'rewards_catalog',
        'reward_redemptions',
        'reward_redemption_history',
        'referrals',
        'referral_status_history',
        'knowledge_documents',
        'knowledge_sync_jobs',
        'ai_conversations',
        'ai_messages'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;
create policy "profiles_member_select_own" on public.profiles
  for select to authenticated
  using (public.is_own_profile(id));
comment on policy "profiles_member_select_own" on public.profiles is
  'Members can read only their own profile row.';

create policy "profiles_member_update_own_safe_fields" on public.profiles
  for update to authenticated
  using (public.is_own_profile(id))
  with check (public.is_own_profile(id));
comment on policy "profiles_member_update_own_safe_fields" on public.profiles is
  'Members can update their own profile row; trigger blocks role, status, member number, and audit ownership changes.';

create policy "profiles_staff_manage_all" on public.profiles
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "profiles_staff_manage_all" on public.profiles is
  'Staff and admins can read and manage member profile records.';

create policy "member_profiles_member_select_own" on public.member_profiles
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "member_profiles_member_select_own" on public.member_profiles is
  'Members can read their own cooperative membership metadata.';

create policy "member_profiles_staff_manage_all" on public.member_profiles
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "member_profiles_staff_manage_all" on public.member_profiles is
  'Staff and admins manage member-only metadata such as referral codes and QR tokens.';

create policy "audit_logs_staff_select" on public.audit_logs
  for select to authenticated
  using (public.is_staff_or_admin());
comment on policy "audit_logs_staff_select" on public.audit_logs is
  'Only staff and admins can read audit history.';

create policy "audit_logs_staff_insert" on public.audit_logs
  for insert to authenticated
  with check (public.is_staff_or_admin() and actor_id = auth.uid());
comment on policy "audit_logs_staff_insert" on public.audit_logs is
  'Only staff and admins can write audit entries, and actor_id must match the current user.';

create policy "snapshot_imports_staff_manage_all" on public.snapshot_imports
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "snapshot_imports_staff_manage_all" on public.snapshot_imports is
  'CSV import batches are admin operations and are hidden from members.';

create policy "snapshot_import_rows_staff_manage_all" on public.snapshot_import_rows
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "snapshot_import_rows_staff_manage_all" on public.snapshot_import_rows is
  'CSV row previews and validation errors are visible only to staff/admin users.';

create policy "financial_snapshots_member_select_own" on public.member_financial_snapshots
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "financial_snapshots_member_select_own" on public.member_financial_snapshots is
  'Members can read only their own manually imported savings and share capital snapshots.';

create policy "financial_snapshots_staff_manage_all" on public.member_financial_snapshots
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "financial_snapshots_staff_manage_all" on public.member_financial_snapshots is
  'Only staff/admin users can insert or correct financial snapshots through controlled import flows.';

create policy "loan_products_member_select_active" on public.loan_products
  for select to authenticated
  using (is_active = true);
comment on policy "loan_products_member_select_active" on public.loan_products is
  'Members can see active loan products for applications.';

create policy "loan_products_staff_manage_all" on public.loan_products
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "loan_products_staff_manage_all" on public.loan_products is
  'Staff/admin users can create, edit, disable, and view all loan products.';

create policy "loan_applications_member_select_own" on public.loan_applications
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "loan_applications_member_select_own" on public.loan_applications is
  'Members can see only their own loan applications.';

create policy "loan_applications_member_create_own" on public.loan_applications
  for insert to authenticated
  with check (member_id = auth.uid() and status in ('draft', 'submitted'));
comment on policy "loan_applications_member_create_own" on public.loan_applications is
  'Members can create their own draft or submitted loan applications only.';

create policy "loan_applications_staff_manage_all" on public.loan_applications
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "loan_applications_staff_manage_all" on public.loan_applications is
  'Staff/admin users can review and update all loan applications.';

create policy "loan_status_history_member_select_own" on public.loan_status_history
  for select to authenticated
  using (public.member_owns_loan(loan_application_id));
comment on policy "loan_status_history_member_select_own" on public.loan_status_history is
  'Members can read status timeline entries only for their own loans.';

create policy "loan_status_history_staff_insert_select" on public.loan_status_history
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "loan_status_history_staff_insert_select" on public.loan_status_history is
  'Staff/admin users own loan status history writes; members cannot forge timeline entries.';

create policy "file_attachments_member_select_own" on public.file_attachments
  for select to authenticated
  using (owner_member_id = auth.uid());
comment on policy "file_attachments_member_select_own" on public.file_attachments is
  'Members can see metadata for files attached to their own records.';

create policy "file_attachments_member_insert_own" on public.file_attachments
  for insert to authenticated
  with check (owner_member_id = auth.uid());
comment on policy "file_attachments_member_insert_own" on public.file_attachments is
  'Members can register attachment metadata only for themselves.';

create policy "file_attachments_staff_manage_all" on public.file_attachments
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "file_attachments_staff_manage_all" on public.file_attachments is
  'Staff/admin users can manage all attachment metadata and generated documents.';

create policy "insurance_products_member_select_active" on public.insurance_products
  for select to authenticated
  using (is_active = true);
comment on policy "insurance_products_member_select_active" on public.insurance_products is
  'Members can see active insurance product definitions.';

create policy "insurance_products_staff_manage_all" on public.insurance_products
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "insurance_products_staff_manage_all" on public.insurance_products is
  'Staff/admin users manage insurance product setup.';

create policy "insurance_records_member_select_own" on public.insurance_records
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "insurance_records_member_select_own" on public.insurance_records is
  'Members can read only their own insurance records.';

create policy "insurance_records_staff_manage_all" on public.insurance_records
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "insurance_records_staff_manage_all" on public.insurance_records is
  'Only staff/admin users can create or update insurance records.';

create policy "insurance_reminders_member_select_own" on public.insurance_reminders
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "insurance_reminders_member_select_own" on public.insurance_reminders is
  'Members can view reminders generated for their own insurance records.';

create policy "insurance_reminders_staff_manage_all" on public.insurance_reminders
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "insurance_reminders_staff_manage_all" on public.insurance_reminders is
  'Reminder creation and send tracking are staff/admin controlled.';

create policy "mortuary_records_member_select_own" on public.mortuary_records
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "mortuary_records_member_select_own" on public.mortuary_records is
  'Members can read only their own mortuary availment records.';

create policy "mortuary_records_staff_manage_all" on public.mortuary_records
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "mortuary_records_staff_manage_all" on public.mortuary_records is
  'Staff/admin users manage mortuary availments and claim-ready data.';

create policy "mortuary_claims_member_select_own" on public.mortuary_claims
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "mortuary_claims_member_select_own" on public.mortuary_claims is
  'Members can view claims attached to their own mortuary record.';

create policy "mortuary_claims_member_create_own" on public.mortuary_claims
  for insert to authenticated
  with check (member_id = auth.uid());
comment on policy "mortuary_claims_member_create_own" on public.mortuary_claims is
  'Members can initiate their own mortuary claim records.';

create policy "mortuary_claims_staff_manage_all" on public.mortuary_claims
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "mortuary_claims_staff_manage_all" on public.mortuary_claims is
  'Staff/admin users review and decide mortuary claims.';

create policy "notification_events_staff_manage_all" on public.notification_events
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "notification_events_staff_manage_all" on public.notification_events is
  'Notification events are system/admin generated, not member writable.';

create policy "notifications_member_select_own" on public.notifications
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "notifications_member_select_own" on public.notifications is
  'Members can read only notifications addressed to them.';

create policy "notifications_staff_manage_all" on public.notifications
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "notifications_staff_manage_all" on public.notifications is
  'Staff/admin users and server workflows manage notification delivery rows.';

create policy "notification_preferences_member_manage_own" on public.notification_preferences
  for all to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());
comment on policy "notification_preferences_member_manage_own" on public.notification_preferences is
  'Members can read and edit their own notification preferences.';

create policy "notification_preferences_staff_manage_all" on public.notification_preferences
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "notification_preferences_staff_manage_all" on public.notification_preferences is
  'Staff/admin users can manage preferences during support workflows.';

create policy "membership_ids_member_select_own" on public.membership_ids
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "membership_ids_member_select_own" on public.membership_ids is
  'Members can read their own digital membership ID metadata.';

create policy "membership_ids_staff_manage_all" on public.membership_ids
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "membership_ids_staff_manage_all" on public.membership_ids is
  'Staff/admin users issue, revoke, and regenerate digital IDs.';

create policy "qr_verification_events_staff_select" on public.qr_verification_events
  for select to authenticated
  using (public.is_staff_or_admin());
comment on policy "qr_verification_events_staff_select" on public.qr_verification_events is
  'Only staff/admin users can inspect QR verification logs.';

create policy "share_certificates_member_select_own" on public.share_certificates
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "share_certificates_member_select_own" on public.share_certificates is
  'Members can read only their own share certificate metadata.';

create policy "share_certificates_staff_manage_all" on public.share_certificates
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "share_certificates_staff_manage_all" on public.share_certificates is
  'Staff/admin users and certificate generation jobs manage share certificates.';

create policy "points_ledger_member_select_own" on public.points_ledger
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "points_ledger_member_select_own" on public.points_ledger is
  'Members can read their own loyalty point ledger.';

create policy "points_ledger_staff_insert_select" on public.points_ledger
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "points_ledger_staff_insert_select" on public.points_ledger is
  'Only staff/admin users and server workflows can write immutable point ledger entries.';

create policy "rewards_catalog_member_select_active" on public.rewards_catalog
  for select to authenticated
  using (is_active = true);
comment on policy "rewards_catalog_member_select_active" on public.rewards_catalog is
  'Members can browse active rewards.';

create policy "rewards_catalog_staff_manage_all" on public.rewards_catalog
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "rewards_catalog_staff_manage_all" on public.rewards_catalog is
  'Staff/admin users manage reward catalog records.';

create policy "reward_redemptions_member_select_own" on public.reward_redemptions
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "reward_redemptions_member_select_own" on public.reward_redemptions is
  'Members can see their own reward redemption requests.';

create policy "reward_redemptions_member_create_own" on public.reward_redemptions
  for insert to authenticated
  with check (member_id = auth.uid() and status = 'requested');
comment on policy "reward_redemptions_member_create_own" on public.reward_redemptions is
  'Members can request rewards only for themselves and only in requested status.';

create policy "reward_redemptions_staff_manage_all" on public.reward_redemptions
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "reward_redemptions_staff_manage_all" on public.reward_redemptions is
  'Staff/admin users approve, reject, or fulfill reward redemptions.';

create policy "reward_history_member_select_own" on public.reward_redemption_history
  for select to authenticated
  using (public.member_owns_reward_redemption(redemption_id));
comment on policy "reward_history_member_select_own" on public.reward_redemption_history is
  'Members can read status history for their own reward redemptions.';

create policy "reward_history_staff_manage_all" on public.reward_redemption_history
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "reward_history_staff_manage_all" on public.reward_redemption_history is
  'Staff/admin users write redemption status history.';

create policy "referrals_member_select_related" on public.referrals
  for select to authenticated
  using (referrer_member_id = auth.uid() or referred_profile_id = auth.uid());
comment on policy "referrals_member_select_related" on public.referrals is
  'Members can see referrals they created or referrals connected to their own profile.';

create policy "referrals_member_create_own" on public.referrals
  for insert to authenticated
  with check (referrer_member_id = auth.uid() and status = 'created');
comment on policy "referrals_member_create_own" on public.referrals is
  'Members can create referral records only with themselves as referrer.';

create policy "referrals_staff_manage_all" on public.referrals
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "referrals_staff_manage_all" on public.referrals is
  'Staff/admin users verify referrals and award referral points.';

create policy "referral_history_member_select_related" on public.referral_status_history
  for select to authenticated
  using (public.member_related_to_referral(referral_id));
comment on policy "referral_history_member_select_related" on public.referral_status_history is
  'Members can read status history for referrals related to them.';

create policy "referral_history_staff_manage_all" on public.referral_status_history
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "referral_history_staff_manage_all" on public.referral_status_history is
  'Staff/admin users write referral status history.';

create policy "knowledge_documents_staff_manage_all" on public.knowledge_documents
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "knowledge_documents_staff_manage_all" on public.knowledge_documents is
  'Knowledge-base documents are admin-only so the AI cannot be grounded on unapproved uploads.';

create policy "knowledge_sync_jobs_staff_manage_all" on public.knowledge_sync_jobs
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());
comment on policy "knowledge_sync_jobs_staff_manage_all" on public.knowledge_sync_jobs is
  'Only staff/admin users can inspect or trigger vector-store sync jobs.';

create policy "ai_conversations_member_select_own" on public.ai_conversations
  for select to authenticated
  using (member_id = auth.uid());
comment on policy "ai_conversations_member_select_own" on public.ai_conversations is
  'Members can read only their own assistant conversations.';

create policy "ai_conversations_member_create_own" on public.ai_conversations
  for insert to authenticated
  with check (member_id = auth.uid());
comment on policy "ai_conversations_member_create_own" on public.ai_conversations is
  'Members can create assistant conversations only for themselves.';

create policy "ai_conversations_staff_select_all" on public.ai_conversations
  for select to authenticated
  using (public.is_staff_or_admin());
comment on policy "ai_conversations_staff_select_all" on public.ai_conversations is
  'Staff/admin users can review AI usage records for support and audit.';

create policy "ai_messages_member_select_own_conversation" on public.ai_messages
  for select to authenticated
  using (public.member_owns_ai_conversation(conversation_id));
comment on policy "ai_messages_member_select_own_conversation" on public.ai_messages is
  'Members can read messages only inside their own AI conversations.';

create policy "ai_messages_member_insert_own_conversation" on public.ai_messages
  for insert to authenticated
  with check (public.member_owns_ai_conversation(conversation_id));
comment on policy "ai_messages_member_insert_own_conversation" on public.ai_messages is
  'Members can add messages only to their own AI conversations; assistant generation remains server-controlled.';

create policy "ai_messages_staff_select_all" on public.ai_messages
  for select to authenticated
  using (public.is_staff_or_admin());
comment on policy "ai_messages_staff_select_all" on public.ai_messages is
  'Staff/admin users can inspect assistant messages for audit and quality review.';

-- Storage policies are intentionally not created in this migration.
-- In hosted Supabase, storage.objects is owned by the Storage service role,
-- so running CREATE POLICY on storage.objects from the SQL editor can fail with:
--   ERROR: 42501: must be owner of relation objects
-- Apply the equivalent storage policies through the Storage dashboard policy UI,
-- or run supabase/storage-policies.sql in an environment/role that owns storage.objects.
