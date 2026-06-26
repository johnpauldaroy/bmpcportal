-- Adds a "selfie with your ID" attachment to the loan application's ID
-- verification step. The applicant uploads a photo of themselves holding their
-- valid ID, captured via the front camera on mobile.
--
-- Enum values cannot be added inside a transaction block that later uses them,
-- so this is a standalone ALTER TYPE. It is idempotent: re-running is a no-op.
alter type public.loan_attachment_kind add value if not exists 'applicant_id_selfie';

-- Fix: submit_loan_application runs with `search_path = public`, but on Supabase
-- pgcrypto lives in the `extensions` schema, so the unqualified gen_random_bytes
-- call failed with "function gen_random_bytes(integer) does not exist". Add
-- `extensions` to the function's search_path so the co-maker invite token can be
-- generated. (Defined separately below so the rest of 0007's body is unchanged.)
alter function public.submit_loan_application(
  uuid, uuid, numeric, integer, text, jsonb, jsonb, jsonb, jsonb
) set search_path = public, extensions;
