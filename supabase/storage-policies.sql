-- Optional Supabase Storage RLS policies.
-- Apply these through the Supabase Storage dashboard policy UI, or with a role
-- that owns storage.objects. Do not include this file in normal app migrations
-- if the SQL editor returns:
--   ERROR: 42501: must be owner of relation objects

drop policy if exists "storage_member_read_own_private_files" on storage.objects;
drop policy if exists "storage_member_upload_own_operational_files" on storage.objects;
drop policy if exists "storage_staff_manage_private_buckets" on storage.objects;

create policy "storage_member_read_own_private_files" on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'loan-attachments',
      'insurance-documents',
      'mortuary-documents',
      'share-certificates',
      'membership-ids'
    )
    and (
      owner = auth.uid()
      or name like auth.uid()::text || '/%'
      or public.is_staff_or_admin()
    )
  );

create policy "storage_member_upload_own_operational_files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in (
      'loan-attachments',
      'insurance-documents',
      'mortuary-documents'
    )
    and (
      owner = auth.uid()
      or name like auth.uid()::text || '/%'
    )
  );

create policy "storage_staff_manage_private_buckets" on storage.objects
  for all to authenticated
  using (
    public.is_staff_or_admin()
    and bucket_id in (
      'loan-attachments',
      'insurance-documents',
      'mortuary-documents',
      'share-certificates',
      'membership-ids',
      'csv-imports',
      'knowledge-documents'
    )
  )
  with check (
    public.is_staff_or_admin()
    and bucket_id in (
      'loan-attachments',
      'insurance-documents',
      'mortuary-documents',
      'share-certificates',
      'membership-ids',
      'csv-imports',
      'knowledge-documents'
    )
  );
