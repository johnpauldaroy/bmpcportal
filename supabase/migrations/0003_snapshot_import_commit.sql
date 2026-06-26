-- Atomic commit path for staged savings/share capital CSV imports.
-- The function is intentionally strict: it refuses invalid rows, duplicate
-- members inside a batch, and existing snapshots for the same member/type/date.

create or replace function public.commit_snapshot_import(
  p_import_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import public.snapshot_imports%rowtype;
  v_actor_role public.user_role;
  v_invalid_count integer;
  v_duplicate_count integer;
  v_existing_count integer;
  v_inserted_count integer;
begin
  select role
  into v_actor_role
  from public.profiles
  where id = p_actor_id;

  if coalesce(v_actor_role in ('staff', 'admin'), false) = false then
    return jsonb_build_object(
      'ok', false,
      'error', 'Staff or admin access is required.'
    );
  end if;

  select *
  into v_import
  from public.snapshot_imports
  where id = p_import_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'Import batch was not found.'
    );
  end if;

  if v_import.status = 'committed' then
    return jsonb_build_object(
      'ok', true,
      'import_id', v_import.id,
      'status', v_import.status,
      'inserted_count', 0,
      'message', 'Import batch was already committed.'
    );
  end if;

  if v_import.status <> 'previewed' then
    return jsonb_build_object(
      'ok', false,
      'error', format('Import batch must be previewed before commit. Current status: %s.', v_import.status)
    );
  end if;

  select count(*)
  into v_invalid_count
  from public.snapshot_import_rows
  where import_id = p_import_id
    and status <> 'valid';

  if v_invalid_count > 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Import batch has invalid rows.'
    );
  end if;

  select count(*)
  into v_duplicate_count
  from (
    select member_id
    from public.snapshot_import_rows
    where import_id = p_import_id
      and status = 'valid'
    group by member_id
    having count(*) > 1
  ) duplicates;

  if v_duplicate_count > 0 then
    update public.snapshot_imports
    set status = 'failed',
        error_summary = jsonb_build_object('commit_error', 'Import batch contains duplicate members.'),
        updated_at = now()
    where id = p_import_id;

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
      v_actor_role,
      'csv_import.failed',
      'snapshot_imports',
      p_import_id,
      'warning',
      jsonb_build_object('reason', 'duplicate_members')
    );

    return jsonb_build_object(
      'ok', false,
      'error', 'Import batch contains duplicate members.'
    );
  end if;

  select count(*)
  into v_existing_count
  from public.snapshot_import_rows import_row
  join public.member_financial_snapshots snapshot
    on snapshot.member_id = import_row.member_id
   and snapshot.type = v_import.type
   and snapshot.effective_date = v_import.effective_date
  where import_row.import_id = p_import_id
    and import_row.status = 'valid';

  if v_existing_count > 0 then
    update public.snapshot_imports
    set status = 'failed',
        error_summary = jsonb_build_object('commit_error', 'One or more target snapshots already exist.'),
        updated_at = now()
    where id = p_import_id;

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
      v_actor_role,
      'csv_import.failed',
      'snapshot_imports',
      p_import_id,
      'warning',
      jsonb_build_object('reason', 'existing_snapshots', 'count', v_existing_count)
    );

    return jsonb_build_object(
      'ok', false,
      'error', 'One or more target snapshots already exist.'
    );
  end if;

  insert into public.member_financial_snapshots (
    import_id,
    import_row_id,
    member_id,
    type,
    amount,
    effective_date,
    created_by
  )
  select
    p_import_id,
    import_row.id,
    import_row.member_id,
    v_import.type,
    import_row.amount,
    v_import.effective_date,
    p_actor_id
  from public.snapshot_import_rows import_row
  where import_row.import_id = p_import_id
    and import_row.status = 'valid';

  get diagnostics v_inserted_count = row_count;

  update public.snapshot_import_rows
  set status = 'committed'
  where import_id = p_import_id
    and status = 'valid';

  update public.snapshot_imports
  set status = 'committed',
      committed_by = p_actor_id,
      committed_at = now(),
      updated_at = now()
  where id = p_import_id;

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
    v_actor_role,
    'csv_import.committed',
    'snapshot_imports',
    p_import_id,
    'info',
    jsonb_build_object(
      'type', v_import.type,
      'effective_date', v_import.effective_date,
      'inserted_count', v_inserted_count,
      'total_amount', v_import.total_amount
    )
  );

  return jsonb_build_object(
    'ok', true,
    'import_id', p_import_id,
    'status', 'committed',
    'inserted_count', v_inserted_count
  );
exception
  when others then
    update public.snapshot_imports
    set status = 'failed',
        error_summary = jsonb_build_object('commit_error', sqlerrm),
        updated_at = now()
    where id = p_import_id
      and status <> 'committed';

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
      v_actor_role,
      'csv_import.failed',
      'snapshot_imports',
      p_import_id,
      'warning',
      jsonb_build_object('error', sqlerrm)
    );

    return jsonb_build_object(
      'ok', false,
      'error', sqlerrm
    );
end;
$$;

grant execute on function public.commit_snapshot_import(uuid, uuid) to authenticated;
