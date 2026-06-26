# RLS Policy Plan

Application-table policies are implemented in `supabase/migrations/0002_rls_policies.sql`. Storage object policies are kept in `supabase/storage-policies.sql` because hosted Supabase can reject `CREATE POLICY ON storage.objects` from the SQL editor unless the execution role owns `storage.objects`.

The baseline rule is: members can read or create rows only when the row is tied to their own `auth.uid()`, while staff/admin users operate through `public.is_staff_or_admin()`.

## Helper Functions

| Function | Purpose |
| --- | --- |
| `public.is_own_profile(profile_id)` | Checks whether a profile row belongs to the authenticated user. |
| `public.member_owns_loan(application_id)` | Checks whether a loan timeline row belongs to the member through its parent loan. |
| `public.member_owns_reward_redemption(redemption_id)` | Checks whether a redemption history row belongs to the member through its parent redemption. |
| `public.member_related_to_referral(referral_id)` | Checks whether the user is the referrer or referred member. |
| `public.member_owns_ai_conversation(conversation_id)` | Checks whether an AI message belongs to the member through its conversation. |
| `public.prevent_profile_privilege_escalation()` | Blocks non-staff users from changing profile privilege fields such as role, status, member number, and audit ownership columns. |

## Profile And Membership

| Policy | Explanation |
| --- | --- |
| `profiles_member_select_own` | Members can read only their own profile row. |
| `profiles_member_update_own_safe_fields` | Members can update their own profile row, but a trigger blocks role/status/member number escalation. |
| `profiles_staff_manage_all` | Staff/admin users can manage all profiles. |
| `member_profiles_member_select_own` | Members can read their own cooperative metadata. |
| `member_profiles_staff_manage_all` | Staff/admin users manage membership metadata, QR tokens, and referral codes. |

## Audit And Imports

| Policy | Explanation |
| --- | --- |
| `audit_logs_staff_select` | Only staff/admin users can read audit logs. |
| `audit_logs_staff_insert` | Staff/admin users can insert audit entries only as themselves. |
| `snapshot_imports_staff_manage_all` | CSV import batches are staff/admin-only. |
| `snapshot_import_rows_staff_manage_all` | CSV preview rows and validation errors are staff/admin-only. |
| `financial_snapshots_member_select_own` | Members can read only their own imported financial snapshots. |
| `financial_snapshots_staff_manage_all` | Staff/admin users manage savings and share capital snapshots. |

## Loans And Files

| Policy | Explanation |
| --- | --- |
| `loan_products_member_select_active` | Members can view active loan products. |
| `loan_products_staff_manage_all` | Staff/admin users manage all loan products. |
| `loan_applications_member_select_own` | Members can read only their own loan applications. |
| `loan_applications_member_create_own` | Members can create only their own draft or submitted applications. |
| `loan_applications_staff_manage_all` | Staff/admin users review and update all loan applications. |
| `loan_status_history_member_select_own` | Members can read status timeline entries for their own loans. |
| `loan_status_history_staff_insert_select` | Staff/admin users manage immutable loan status history. |
| `file_attachments_member_select_own` | Members can view metadata for their own attachments. |
| `file_attachments_member_insert_own` | Members can register attachment metadata only for themselves. |
| `file_attachments_staff_manage_all` | Staff/admin users manage all attachment metadata. |

## Insurance And Mortuary

| Policy | Explanation |
| --- | --- |
| `insurance_products_member_select_active` | Members can view active insurance products. |
| `insurance_products_staff_manage_all` | Staff/admin users manage insurance product setup. |
| `insurance_records_member_select_own` | Members can read only their own insurance records. |
| `insurance_records_staff_manage_all` | Staff/admin users manage insurance records. |
| `insurance_reminders_member_select_own` | Members can view reminders for their own records. |
| `insurance_reminders_staff_manage_all` | Staff/admin users manage reminder scheduling and send state. |
| `mortuary_records_member_select_own` | Members can read only their own mortuary records. |
| `mortuary_records_staff_manage_all` | Staff/admin users manage mortuary availments. |
| `mortuary_claims_member_select_own` | Members can view their own mortuary claims. |
| `mortuary_claims_member_create_own` | Members can submit claim records tied to themselves. |
| `mortuary_claims_staff_manage_all` | Staff/admin users review and decide mortuary claims. |

## Notifications And Documents

| Policy | Explanation |
| --- | --- |
| `notification_events_staff_manage_all` | Notification events are staff/system generated. |
| `notifications_member_select_own` | Members can read notifications addressed to them. |
| `notifications_staff_manage_all` | Staff/admin users manage notification delivery records. |
| `notification_preferences_member_manage_own` | Members can manage their own notification preferences. |
| `notification_preferences_staff_manage_all` | Staff/admin users can support preference changes. |
| `membership_ids_member_select_own` | Members can read their own digital ID metadata. |
| `membership_ids_staff_manage_all` | Staff/admin users issue, revoke, and regenerate digital IDs. |
| `qr_verification_events_staff_select` | Staff/admin users can inspect QR verification logs. |
| `share_certificates_member_select_own` | Members can read their own share certificate metadata. |
| `share_certificates_staff_manage_all` | Staff/admin users and generation jobs manage share certificates. |

## Loyalty And Referrals

| Policy | Explanation |
| --- | --- |
| `points_ledger_member_select_own` | Members can read their own points ledger. |
| `points_ledger_staff_insert_select` | Staff/admin users write immutable point ledger entries. |
| `rewards_catalog_member_select_active` | Members can browse active rewards. |
| `rewards_catalog_staff_manage_all` | Staff/admin users manage reward catalog records. |
| `reward_redemptions_member_select_own` | Members can view their own redemption requests. |
| `reward_redemptions_member_create_own` | Members can request rewards only for themselves in `requested` status. |
| `reward_redemptions_staff_manage_all` | Staff/admin users approve, reject, or fulfill redemptions. |
| `reward_history_member_select_own` | Members can read status history for their own redemptions. |
| `reward_history_staff_manage_all` | Staff/admin users write redemption status history. |
| `referrals_member_select_related` | Members can view referrals where they are referrer or referred member. |
| `referrals_member_create_own` | Members can create referral rows only as the referrer. |
| `referrals_staff_manage_all` | Staff/admin users verify referrals and award points. |
| `referral_history_member_select_related` | Members can read referral history related to them. |
| `referral_history_staff_manage_all` | Staff/admin users write referral status history. |

## AI Knowledge Base

| Policy | Explanation |
| --- | --- |
| `knowledge_documents_staff_manage_all` | Only staff/admin users can manage knowledge-base documents. |
| `knowledge_sync_jobs_staff_manage_all` | Only staff/admin users can inspect or trigger vector-store sync jobs. |
| `ai_conversations_member_select_own` | Members can read only their own AI conversations. |
| `ai_conversations_member_create_own` | Members can create AI conversations only for themselves. |
| `ai_conversations_staff_select_all` | Staff/admin users can review AI conversation records for audit. |
| `ai_messages_member_select_own_conversation` | Members can read messages in their own conversations. |
| `ai_messages_member_insert_own_conversation` | Members can add messages only to their own conversations. |
| `ai_messages_staff_select_all` | Staff/admin users can inspect AI messages for audit and quality review. |

## Storage

| Policy | Explanation |
| --- | --- |
| `storage_member_read_own_private_files` | Members can read private files they own; staff/admin users can read operational files. |
| `storage_member_upload_own_operational_files` | Members can upload requirement files only into member-owned paths. |
| `storage_staff_manage_private_buckets` | Staff/admin users manage all private operational buckets. |

Apply these storage policies through the Supabase Storage dashboard policy UI, or run `supabase/storage-policies.sql` with a role that owns `storage.objects`.
