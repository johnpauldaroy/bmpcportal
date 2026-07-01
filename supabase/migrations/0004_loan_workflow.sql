-- Transactional loan application submission and admin review workflows.
-- Also ensures a fresh environment has active products to apply against.

insert into public.loan_products (
  code,
  name,
  description,
  min_amount,
  max_amount,
  min_term_months,
  max_term_months,
  interest_rate_percent
)
values
  ('REGULAR', 'Regular Loan', 'General member loan product.', 1000, 100000, 3, 36, null),
  ('EMERGENCY', 'Emergency Loan', 'Short-term loan for urgent member needs.', 500, 25000, 1, 12, null)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    min_amount = excluded.min_amount,
    max_amount = excluded.max_amount,
    min_term_months = excluded.min_term_months,
    max_term_months = excluded.max_term_months,
    interest_rate_percent = excluded.interest_rate_percent,
    is_active = true,
    updated_at = now();

create or replace function public.submit_loan_application(
  p_actor_id uuid,
  p_product_id uuid,
  p_amount_requested numeric,
  p_preferred_term_months integer,
  p_purpose text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_product public.loan_products%rowtype;
  v_application public.loan_applications%rowtype;
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

  insert into public.loan_applications (
    member_id,
    product_id,
    amount_requested,
    preferred_term_months,
    purpose,
    status,
    created_by
  )
  values (
    p_actor_id,
    p_product_id,
    p_amount_requested,
    p_preferred_term_months,
    p_purpose,
    'submitted',
    p_actor_id
  )
  returning *
  into v_application;

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
      'preferred_term_months', p_preferred_term_months
    )
  );

  return jsonb_build_object(
    'ok', true,
    'application_id', v_application.id,
    'application_number', v_application.application_number,
    'status', v_application.status
  );
end;
$$;

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

grant execute on function public.submit_loan_application(uuid, uuid, numeric, integer, text) to authenticated;
grant execute on function public.review_loan_application(uuid, uuid, public.loan_status, text) to authenticated;
