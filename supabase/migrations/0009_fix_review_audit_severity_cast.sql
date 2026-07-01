-- Fix: review_loan_application failed with
--   column "severity" is of type audit_severity but expression is of type text
-- The CASE expression that picks the audit severity returns text, which Postgres
-- will not implicitly coerce to the audit_severity enum. Cast it explicitly.
-- Redefined in full (matching 0004) so the live DB picks up the corrected body.

create or replace function public.review_loan_application(
  p_application_id uuid,
  p_actor_id uuid,
  p_status public.loan_status,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role public.user_role;
  v_application public.loan_applications%rowtype;
begin
  select role
  into v_actor_role
  from public.profiles
  where id = p_actor_id;

  if coalesce(v_actor_role in ('staff', 'admin'), false) = false then
    return jsonb_build_object('ok', false, 'error', 'Staff or admin access is required.');
  end if;

  if p_status not in (
    'under_review',
    'needs_more_info',
    'approved',
    'released',
    'rejected',
    'cancelled'
  ) then
    return jsonb_build_object('ok', false, 'error', 'Unsupported review status.');
  end if;

  select *
  into v_application
  from public.loan_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Loan application was not found.');
  end if;

  if v_application.status = p_status then
    return jsonb_build_object(
      'ok', true,
      'application_id', v_application.id,
      'status', v_application.status,
      'message', 'Status is already current.'
    );
  end if;

  update public.loan_applications
  set status = p_status,
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      decision_note = nullif(trim(coalesce(p_note, '')), ''),
      released_at = case when p_status = 'released' then now() else released_at end,
      updated_by = p_actor_id,
      updated_at = now()
  where id = p_application_id;

  insert into public.loan_status_history (
    loan_application_id,
    previous_status,
    status,
    note,
    changed_by
  )
  values (
    p_application_id,
    v_application.status,
    p_status,
    nullif(trim(coalesce(p_note, '')), ''),
    p_actor_id
  );

  insert into public.audit_logs (
    actor_id,
    actor_role,
    action,
    target_table,
    target_id,
    severity,
    old_values,
    new_values,
    metadata
  )
  values (
    p_actor_id,
    v_actor_role,
    'loan.status_changed',
    'loan_applications',
    p_application_id,
    (case when p_status in ('rejected', 'cancelled') then 'warning' else 'info' end)::public.audit_severity,
    jsonb_build_object('status', v_application.status),
    jsonb_build_object('status', p_status),
    jsonb_build_object('note', nullif(trim(coalesce(p_note, '')), ''))
  );

  return jsonb_build_object(
    'ok', true,
    'application_id', p_application_id,
    'previous_status', v_application.status,
    'status', p_status
  );
end;
$$;

grant execute on function public.review_loan_application(uuid, uuid, public.loan_status, text) to authenticated;
