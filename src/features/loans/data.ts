import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type LoanProduct = Database["public"]["Tables"]["loan_products"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type LoanApplication = Database["public"]["Tables"]["loan_applications"]["Row"];
export type LoanAttachment = Database["public"]["Tables"]["loan_attachments"]["Row"];
export type LoanCoMaker = Database["public"]["Tables"]["loan_co_makers"]["Row"];
export type LoanRealProperty = Database["public"]["Tables"]["loan_real_properties"]["Row"];
export type LoanStatusHistory = Database["public"]["Tables"]["loan_status_history"]["Row"];

export type LoanAgreement = Database["public"]["Tables"]["loan_agreements"]["Row"];
export type { LoanAgreementStatus } from "@/types/database";

export type LoanApplicationWithDetails = LoanApplication & {
  product: LoanProduct | null;
  branch: Branch | null;
  member: {
    id: string;
    fullName: string;
    memberNumber: string | null;
  } | null;
  attachments: LoanAttachment[];
  coMakers: LoanCoMaker[];
  history: LoanStatusHistory[];
  realProperties: LoanRealProperty[];
};

export async function getActiveLoanProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loan_products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getActiveBranches() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getAllLoanProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loan_products")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getMemberLoanApplications() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: applications } = await supabase
    .from("loan_applications")
    .select("*")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  return hydrateLoanApplications(applications ?? []);
}

// Member-scoped single application fetch. RLS restricts the rows to the signed-in
// member, and we additionally filter by member_id so it can never return another
// member's application even if RLS were misconfigured.
export async function getMemberLoanApplication(applicationId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: application } = await supabase
    .from("loan_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("member_id", user.id)
    .maybeSingle();

  if (!application) return null;
  const [hydrated] = await hydrateLoanApplications([application]);
  return hydrated ?? null;
}

// Agreement for an application (member-scoped; RLS limits to own application).
export async function getMemberLoanAgreement(applicationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loan_agreements")
    .select("*")
    .eq("loan_application_id", applicationId)
    .maybeSingle();
  return (data as LoanAgreement | null) ?? null;
}

// All agreements for the signed-in member's applications (RLS-scoped).
export async function getMemberLoanAgreements() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [] as LoanAgreement[];

  const { data } = await supabase.from("loan_agreements").select("*");
  return (data as LoanAgreement[] | null) ?? [];
}

export async function getAdminLoanAgreement(applicationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loan_agreements")
    .select("*")
    .eq("loan_application_id", applicationId)
    .maybeSingle();
  return (data as LoanAgreement | null) ?? null;
}

export async function getAdminLoanApplications() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("loan_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return hydrateLoanApplications(applications ?? []);
}

export async function getAdminLoanApplication(applicationId: string) {
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("loan_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) {
    return null;
  }

  const [hydrated] = await hydrateLoanApplications([application]);
  return hydrated ?? null;
}

async function hydrateLoanApplications(applications: LoanApplication[]) {
  if (applications.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const productIds = Array.from(new Set(applications.map((application) => application.product_id)));
  const memberIds = Array.from(new Set(applications.map((application) => application.member_id)));
  const branchIds = Array.from(
    new Set(
      applications
        .map((application) => application.branch_id)
        .filter((branchId): branchId is string => Boolean(branchId))
    )
  );
  const applicationIds = applications.map((application) => application.id);

  const [
    { data: products },
    { data: branches },
    { data: members },
    { data: coMakers },
    { data: realProperties },
    { data: attachments },
    { data: history }
  ] = await Promise.all([
    supabase.from("loan_products").select("*").in("id", productIds),
    branchIds.length > 0
      ? supabase.from("branches").select("*").in("id", branchIds)
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, full_name, member_number").in("id", memberIds),
    supabase
      .from("loan_co_makers")
      .select("*")
      .in("loan_application_id", applicationIds)
      .order("co_maker_role", { ascending: true }),
    supabase
      .from("loan_real_properties")
      .select("*")
      .in("loan_application_id", applicationIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("loan_attachments")
      .select("*")
      .in("loan_application_id", applicationIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("loan_status_history")
      .select("*")
      .in("loan_application_id", applicationIds)
      .order("created_at", { ascending: true })
  ]);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const branchById = new Map((branches ?? []).map((branch) => [branch.id, branch]));
  const memberById = new Map(
    (members ?? []).map((member) => [
      member.id,
      {
        id: member.id,
        fullName: member.full_name,
        memberNumber: member.member_number
      }
    ])
  );
  const coMakersByApplicationId = groupByApplicationId(coMakers ?? []);
  const realPropertiesByApplicationId = groupByApplicationId(realProperties ?? []);
  const attachmentsByApplicationId = groupByApplicationId(attachments ?? []);
  const historyByApplicationId = new Map<string, LoanStatusHistory[]>();

  for (const entry of history ?? []) {
    const entries = historyByApplicationId.get(entry.loan_application_id) ?? [];
    entries.push(entry);
    historyByApplicationId.set(entry.loan_application_id, entries);
  }

  return applications.map<LoanApplicationWithDetails>((application) => ({
    ...application,
    product: productById.get(application.product_id) ?? null,
    branch: application.branch_id ? branchById.get(application.branch_id) ?? null : null,
    member: memberById.get(application.member_id) ?? null,
    attachments: attachmentsByApplicationId.get(application.id) ?? [],
    coMakers: coMakersByApplicationId.get(application.id) ?? [],
    history: historyByApplicationId.get(application.id) ?? [],
    realProperties: realPropertiesByApplicationId.get(application.id) ?? []
  }));
}

function groupByApplicationId<T extends { loan_application_id: string }>(rows: T[]) {
  const rowsByApplicationId = new Map<string, T[]>();

  for (const row of rows) {
    const entries = rowsByApplicationId.get(row.loan_application_id) ?? [];
    entries.push(row);
    rowsByApplicationId.set(row.loan_application_id, entries);
  }

  return rowsByApplicationId;
}
