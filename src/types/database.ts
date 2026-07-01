export type UserRole = "member" | "admin" | "staff";
export type MemberStatus = "pending" | "active" | "inactive" | "suspended" | "closed";
export type SnapshotType = "savings" | "share_capital";
export type ImportStatus = "draft" | "previewed" | "committed" | "failed" | "cancelled";
export type ImportRowStatus = "valid" | "invalid" | "committed" | "skipped";
export type LoanStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_more_info"
  | "approved"
  | "released"
  | "rejected"
  | "cancelled";
export type LoanAgreementStatus = "draft" | "sent" | "accepted" | "declined" | "cancelled";
export type AuditSeverity = "info" | "warning" | "critical";
export type CoverageStatus = "active" | "expiring" | "expired" | "cancelled";
export type MortuaryStatus = "active" | "inactive" | "claim_pending" | "claimed" | "cancelled";
export type ClaimStatus = "draft" | "submitted" | "under_review" | "approved" | "released" | "rejected" | "cancelled";
export type DocumentStatus = "draft" | "issued" | "revoked" | "expired";
export type PointsEntryType = "earn" | "redeem" | "adjustment" | "reversal" | "expiry";
export type RedemptionStatus = "requested" | "approved" | "released" | "rejected" | "cancelled";
export type ReferralStatus = "created" | "invited" | "registered" | "verified" | "rewarded" | "cancelled";
export type NotificationChannel = "in_app" | "push" | "email" | "sms";
export type NotificationStatus = "queued" | "sent" | "read" | "failed" | "cancelled";
export type KnowledgeSyncStatus = "pending" | "uploading" | "synced" | "failed" | "archived";
export type LoanSecurityKind =
  | "savings_time_deposits"
  | "real_estate"
  | "chattel"
  | "jewelry"
  | "none";
export type LoanPropertyKind = "residential" | "commercial" | "industrial" | "agricultural";
export type LoanCoMakerRole = "first" | "second";
export type LoanCoMakerStatus = "invited" | "completed" | "declined";
export type LoanAttachmentKind =
  | "applicant_signature"
  | "applicant_id_front"
  | "applicant_id_back"
  | "applicant_id_selfie"
  | "spouse_signature"
  | "spouse_id_front"
  | "spouse_id_back"
  | "first_co_maker_signature"
  | "first_co_maker_id_front"
  | "first_co_maker_id_back"
  | "second_co_maker_signature"
  | "second_co_maker_id_front"
  | "second_co_maker_id_back";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      cif_records: {
        Row: {
          id: string;
          cif_key: string;
          member_number: string;
          branch_id: string;
          is_claimed: boolean;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cif_key: string;
          member_number: string;
          branch_id: string;
          is_claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_claimed?: boolean;
          claimed_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          member_number: string | null;
          role: UserRole;
          status: MemberStatus;
          full_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          date_of_birth: string | null;
          avatar_path: string | null;
          last_seen_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          member_number?: string | null;
          role?: UserRole;
          status?: MemberStatus;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          avatar_path?: string | null;
          last_seen_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          member_number?: string | null;
          role?: UserRole;
          status?: MemberStatus;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          avatar_path?: string | null;
          last_seen_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_role: UserRole | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          severity: AuditSeverity;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_role?: UserRole | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          severity?: AuditSeverity;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      snapshot_imports: {
        Row: {
          id: string;
          type: SnapshotType;
          effective_date: string;
          status: ImportStatus;
          source_file_path: string | null;
          source_file_name: string | null;
          source_file_hash: string;
          row_count: number;
          valid_row_count: number;
          invalid_row_count: number;
          total_amount: number;
          error_summary: Json;
          imported_by: string | null;
          committed_by: string | null;
          committed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: SnapshotType;
          effective_date: string;
          status?: ImportStatus;
          source_file_path?: string | null;
          source_file_name?: string | null;
          source_file_hash: string;
          row_count?: number;
          valid_row_count?: number;
          invalid_row_count?: number;
          total_amount?: number;
          error_summary?: Json;
          imported_by?: string | null;
          committed_by?: string | null;
          committed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ImportStatus;
          source_file_path?: string | null;
          source_file_name?: string | null;
          row_count?: number;
          valid_row_count?: number;
          invalid_row_count?: number;
          total_amount?: number;
          error_summary?: Json;
          committed_by?: string | null;
          committed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      snapshot_import_rows: {
        Row: {
          id: string;
          import_id: string;
          row_number: number;
          member_number: string | null;
          member_id: string | null;
          amount: number | null;
          effective_date: string | null;
          status: ImportRowStatus;
          errors: Json;
          raw_row: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          row_number: number;
          member_number?: string | null;
          member_id?: string | null;
          amount?: number | null;
          effective_date?: string | null;
          status?: ImportRowStatus;
          errors?: Json;
          raw_row?: Json;
          created_at?: string;
        };
        Update: {
          member_id?: string | null;
          amount?: number | null;
          effective_date?: string | null;
          status?: ImportRowStatus;
          errors?: Json;
          raw_row?: Json;
        };
        Relationships: [];
      };
      member_financial_snapshots: {
        Row: {
          id: string;
          import_id: string;
          import_row_id: string | null;
          member_id: string;
          type: SnapshotType;
          amount: number;
          effective_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          import_row_id?: string | null;
          member_id: string;
          type: SnapshotType;
          amount: number;
          effective_date: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      loan_products: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          min_amount: number;
          max_amount: number;
          min_term_months: number;
          max_term_months: number;
          interest_rate_percent: number | null;
          required_documents: Json;
          is_active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          min_amount?: number;
          max_amount: number;
          min_term_months?: number;
          max_term_months: number;
          interest_rate_percent?: number | null;
          required_documents?: Json;
          is_active?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          min_amount?: number;
          max_amount?: number;
          min_term_months?: number;
          max_term_months?: number;
          interest_rate_percent?: number | null;
          required_documents?: Json;
          is_active?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      loan_applications: {
        Row: {
          id: string;
          member_id: string;
          product_id: string;
          application_number: string;
          amount_requested: number;
          preferred_term_months: number;
          purpose: string;
          status: LoanStatus;
          submitted_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          decision_note: string | null;
          released_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          loan_type: string | null;
          loan_type_other: string | null;
          security_offered: LoanSecurityKind[];
          amount_in_words: string | null;
          first_payment_due: string | null;
          branch_id: string | null;
          applicant_first_name: string | null;
          applicant_last_name: string | null;
          applicant_middle_name: string | null;
          present_address: string | null;
          permanent_address: string | null;
          phone_no: string | null;
          landline_no: string | null;
          other_contact_no: string | null;
          applicant_email: string | null;
          civil_status: string | null;
          no_of_dependents: number | null;
          occupation: string | null;
          employer: string | null;
          monthly_salary: number | null;
          employment_status: string | null;
          other_monthly_income: number | null;
          tax_identification_number: string | null;
          valid_id: string | null;
          id_number: string | null;
          spouse_name: string | null;
          spouse_employer: string | null;
          spouse_monthly_salary: number | null;
          share_capital_as_of: string | null;
          share_capital_amount: number | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          product_id: string;
          application_number?: string;
          amount_requested: number;
          preferred_term_months: number;
          purpose: string;
          status?: LoanStatus;
          submitted_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          decision_note?: string | null;
          released_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          loan_type?: string | null;
          loan_type_other?: string | null;
          security_offered?: LoanSecurityKind[];
          amount_in_words?: string | null;
          first_payment_due?: string | null;
          branch_id?: string | null;
          applicant_first_name?: string | null;
          applicant_last_name?: string | null;
          applicant_middle_name?: string | null;
          present_address?: string | null;
          permanent_address?: string | null;
          phone_no?: string | null;
          landline_no?: string | null;
          other_contact_no?: string | null;
          applicant_email?: string | null;
          civil_status?: string | null;
          no_of_dependents?: number | null;
          occupation?: string | null;
          employer?: string | null;
          monthly_salary?: number | null;
          employment_status?: string | null;
          other_monthly_income?: number | null;
          tax_identification_number?: string | null;
          valid_id?: string | null;
          id_number?: string | null;
          spouse_name?: string | null;
          spouse_employer?: string | null;
          spouse_monthly_salary?: number | null;
          share_capital_as_of?: string | null;
          share_capital_amount?: number | null;
        };
        Update: {
          status?: LoanStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          decision_note?: string | null;
          released_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      loan_co_makers: {
        Row: {
          id: string;
          loan_application_id: string;
          co_maker_role: LoanCoMakerRole;
          first_name: string;
          last_name: string;
          middle_name: string | null;
          contact_no: string | null;
          email: string;
          invite_token: string;
          invite_status: LoanCoMakerStatus;
          invited_at: string;
          completed_at: string | null;
          present_address: string | null;
          permanent_address: string | null;
          phone_no: string | null;
          landline_no: string | null;
          other_contact_no: string | null;
          civil_status: string | null;
          no_of_dependents: number | null;
          occupation: string | null;
          employer: string | null;
          monthly_salary: number | null;
          employment_status: string | null;
          other_monthly_income: number | null;
          tax_identification_number: string | null;
          valid_id: string | null;
          id_number: string | null;
          spouse_name: string | null;
          share_capital_as_of: string | null;
          share_capital_amount: number | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      loan_real_properties: {
        Row: {
          id: string;
          loan_application_id: string;
          owner_role: string;
          description: LoanPropertyKind | null;
          land_title_number: string | null;
          lot_number: string | null;
          location: string | null;
          lot_area_sqm: number | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      loan_attachments: {
        Row: {
          id: string;
          loan_application_id: string;
          kind: LoanAttachmentKind;
          bucket_id: string;
          storage_path: string;
          file_name: string | null;
          content_type: string | null;
          byte_size: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      loan_agreements: {
        Row: {
          id: string;
          loan_application_id: string;
          status: LoanAgreementStatus;
          amount_of_loan: number;
          loan_retention_percent: number | null;
          loan_retention_amount: number | null;
          service_fee_percent: number | null;
          service_fee_amount: number | null;
          filing_fee: number;
          other_deductions: Array<{ label: string; amount: number }>;
          total_deduction: number | null;
          net_loan_proceeds: number | null;
          type_of_loan: string | null;
          purpose_of_loan: string | null;
          term_months: number | null;
          interest_rate_percent: number | null;
          security: string | null;
          monthly_amortization: number | null;
          loan_date: string | null;
          maturity_date: string | null;
          first_payment_due: string | null;
          amort_breakdown: Record<string, number>;
          sent_at: string | null;
          sent_by: string | null;
          accepted_at: string | null;
          maker_signature_bucket: string | null;
          maker_signature_path: string | null;
          maker_acknowledged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      loan_status_history: {
        Row: {
          id: string;
          loan_application_id: string;
          previous_status: LoanStatus | null;
          status: LoanStatus;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_application_id: string;
          previous_status?: LoanStatus | null;
          status: LoanStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      member_profiles: {
        Row: {
          id: string;
          member_id: string;
          membership_date: string | null;
          occupation: string | null;
          employer: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          referral_code: string;
          qr_token: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      insurance_products: {
        Row: {
          id: string;
          name: string;
          provider: string | null;
          description: string | null;
          default_coverage_months: number | null;
          is_active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      insurance_records: {
        Row: {
          id: string;
          member_id: string;
          product_id: string | null;
          policy_number: string | null;
          provider: string | null;
          coverage_amount: number | null;
          premium_amount: number | null;
          effective_date: string;
          expiry_date: string;
          status: CoverageStatus;
          metadata: Json;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      mortuary_records: {
        Row: {
          id: string;
          member_id: string;
          status: MortuaryStatus;
          effective_date: string | null;
          beneficiary_name: string | null;
          beneficiary_relationship: string | null;
          beneficiary_contact: string | null;
          contribution_amount: number | null;
          claim_ready_data: Json;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      mortuary_claims: {
        Row: {
          id: string;
          mortuary_record_id: string;
          member_id: string;
          claimant_name: string;
          claimant_contact: string | null;
          status: ClaimStatus;
          claim_amount: number | null;
          submitted_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          decision_note: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          event_id: string | null;
          member_id: string;
          channel: NotificationChannel;
          status: NotificationStatus;
          title: string;
          body: string;
          metadata: Json;
          scheduled_for: string | null;
          sent_at: string | null;
          read_at: string | null;
          failed_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      membership_ids: {
        Row: {
          id: string;
          member_id: string;
          qr_token: string;
          status: DocumentStatus;
          issued_at: string;
          revoked_at: string | null;
          storage_path: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      qr_verification_events: {
        Row: {
          id: string;
          membership_id: string | null;
          qr_token: string;
          verified: boolean;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          membership_id?: string | null;
          qr_token: string;
          verified?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      share_certificates: {
        Row: {
          id: string;
          member_id: string;
          certificate_number: string;
          threshold_number: number;
          share_capital_amount: number;
          based_on_snapshot_id: string | null;
          status: DocumentStatus;
          issued_at: string;
          revoked_at: string | null;
          storage_path: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      points_ledger: {
        Row: {
          id: string;
          member_id: string;
          entry_type: PointsEntryType;
          points: number;
          balance_after: number | null;
          reason: string;
          reference_table: string | null;
          reference_id: string | null;
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      rewards_catalog: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          points_cost: number;
          inventory_count: number | null;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reward_redemptions: {
        Row: {
          id: string;
          member_id: string;
          reward_id: string;
          redemption_number: string;
          points_cost: number;
          status: RedemptionStatus;
          requested_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          fulfilled_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_member_id: string;
          referred_profile_id: string | null;
          referral_code: string;
          status: ReferralStatus;
          invited_name: string | null;
          invited_contact: string | null;
          verified_at: string | null;
          reward_points_awarded: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      knowledge_documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          storage_path: string;
          content_type: string | null;
          byte_size: number | null;
          checksum: string | null;
          openai_file_id: string | null;
          vector_store_id: string | null;
          sync_status: KnowledgeSyncStatus;
          sync_error: string | null;
          synced_at: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      commit_snapshot_import: {
        Args: {
          p_import_id: string;
          p_actor_id: string;
        };
        Returns: Json;
      };
      submit_loan_application: {
        Args: {
          p_actor_id: string;
          p_product_id: string;
          p_amount_requested: number;
          p_preferred_term_months: number;
          p_purpose: string;
          p_details?: Json;
          p_co_makers?: Json;
          p_real_properties?: Json;
          p_attachments?: Json;
        };
        Returns: Json;
      };
      complete_co_maker: {
        Args: {
          p_invite_token: string;
          p_details?: Json;
          p_attachments?: Json;
        };
        Returns: Json;
      };
      review_loan_application: {
        Args: {
          p_application_id: string;
          p_actor_id: string;
          p_status: LoanStatus;
          p_note: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      snapshot_type: SnapshotType;
      import_status: ImportStatus;
      import_row_status: ImportRowStatus;
      loan_status: LoanStatus;
      audit_severity: AuditSeverity;
      coverage_status: CoverageStatus;
      mortuary_status: MortuaryStatus;
      claim_status: ClaimStatus;
      document_status: DocumentStatus;
      points_entry_type: PointsEntryType;
      redemption_status: RedemptionStatus;
      referral_status: ReferralStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      knowledge_sync_status: KnowledgeSyncStatus;
      loan_security_kind: LoanSecurityKind;
      loan_property_kind: LoanPropertyKind;
      loan_co_maker_role: LoanCoMakerRole;
      loan_co_maker_status: LoanCoMakerStatus;
      loan_attachment_kind: LoanAttachmentKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
