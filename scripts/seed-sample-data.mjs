import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const [, key, raw] = match;
    if (!process.env[key])
      process.env[key] = raw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Find member & admin ───────────────────────────────────────────
const { data: member, error: profileErr } = await sb
  .from("profiles")
  .select("id, full_name, member_number, email")
  .eq("role", "member")
  .single();

const { data: admin } = await sb
  .from("profiles")
  .select("id")
  .eq("role", "admin")
  .single();

if (profileErr || !member) {
  console.error("Could not find member profile:", profileErr?.message);
  process.exit(1);
}

const mid = member.id;
const adminId = admin?.id ?? mid;
console.log(`\nSeeding for: ${member.full_name} (${member.email})`);
console.log(`Member ID : ${mid}\n`);

function ok(table, n) { console.log(`  ✓ ${table} (${n})`); }
function skip(table)  { console.log(`  – ${table} (skipped — already has data)`); }
function fail(table, e){ console.error(`  ✗ ${table}:`, e); }

// ── 1. Financial snapshots ────────────────────────────────────────
console.log("1. Financial snapshots");

// Need a committed snapshot_import as FK
async function insertImport(type, date, fileName, amount) {
  const hash = `seed-${type}-${date}`;
  // upsert on the unique constraint (type, effective_date, source_file_hash)
  const { data, error } = await sb
    .from("snapshot_imports")
    .upsert({ type, effective_date: date, status: "committed",
      source_file_name: fileName, source_file_hash: hash,
      row_count: 1, valid_row_count: 1, invalid_row_count: 0,
      total_amount: amount, error_summary: {},
      imported_by: adminId, committed_by: adminId,
      committed_at: new Date().toISOString() },
      { onConflict: "type,effective_date,source_file_hash" })
    .select("id").single();
  if (error) { console.error("  ✗ snapshot_imports:", error.message); return null; }
  return data;
}

const imp1 = await insertImport("savings",       "2026-05-01", "seed_savings_may2026.csv",        45250.00);
const imp2 = await insertImport("share_capital", "2026-05-01", "seed_share_capital_may2026.csv",  12500.00);
const imp3 = await insertImport("savings",       "2026-04-01", "seed_savings_apr2026.csv",        38750.00);
const imp4 = await insertImport("share_capital", "2026-04-01", "seed_share_capital_apr2026.csv",  10000.00);

if (!imp1 || !imp2 || !imp3 || !imp4) {
  console.error("  Failed to create snapshot_imports — skipping snapshots");
} else {

const { error: snapErr } = await sb.from("member_financial_snapshots").upsert([
  { member_id: mid, import_id: imp1.id, type: "savings",       amount: 45250.00, effective_date: "2026-05-01" },
  { member_id: mid, import_id: imp2.id, type: "share_capital", amount: 12500.00, effective_date: "2026-05-01" },
  { member_id: mid, import_id: imp3.id, type: "savings",       amount: 38750.00, effective_date: "2026-04-01" },
  { member_id: mid, import_id: imp4.id, type: "share_capital", amount: 10000.00, effective_date: "2026-04-01" },
], { onConflict: "member_id,type,effective_date" });

  if (snapErr) fail("member_financial_snapshots", snapErr.message);
  else ok("member_financial_snapshots", "4 rows — savings ₱45,250 | share capital ₱12,500");
}

// ── 2. Loan products ──────────────────────────────────────────────
console.log("\n2. Loan products");
let { data: prods } = await sb.from("loan_products").select("id,code").in("code", ["REGULAR","EMERGENCY"]);
let regularId = prods?.find(p => p.code === "REGULAR")?.id;
let emergencyId = prods?.find(p => p.code === "EMERGENCY")?.id;
if (!regularId) {
  const { data: p } = await sb.from("loan_products").insert({ code:"REGULAR", name:"Regular Loan",
    description:"General member loan product.", min_amount:1000, max_amount:100000,
    min_term_months:3, max_term_months:36 }).select("id").single();
  regularId = p?.id;
}
if (!emergencyId) {
  const { data: p } = await sb.from("loan_products").insert({ code:"EMERGENCY", name:"Emergency Loan",
    description:"Short-term urgent needs loan.", min_amount:500, max_amount:25000,
    min_term_months:1, max_term_months:12 }).select("id").single();
  emergencyId = p?.id;
}
ok("loan_products", "REGULAR + EMERGENCY");

// ── 3. Loan applications ──────────────────────────────────────────
console.log("\n3. Loan applications");
const { data: existLoans } = await sb.from("loan_applications").select("id").eq("member_id", mid).limit(1);
if (existLoans?.length) { skip("loan_applications"); } else {
  const { error: lErr } = await sb.from("loan_applications").insert([
    { member_id: mid, product_id: regularId, amount_requested: 25000,
      preferred_term_months: 12, purpose: "Home improvement and furniture",
      status: "released", created_by: mid,
      reviewed_at: "2026-04-20T10:00:00Z", released_at: "2026-04-25T10:00:00Z",
      decision_note: "Approved. All requirements complete." },
    { member_id: mid, product_id: emergencyId, amount_requested: 5000,
      preferred_term_months: 3, purpose: "Medical emergency expenses",
      status: "under_review", created_by: mid }
  ]);
  if (lErr) fail("loan_applications", lErr.message);
  else ok("loan_applications", "2 rows — 1 released, 1 under review");
}

// ── 4. Points ledger ──────────────────────────────────────────────
console.log("\n4. Points ledger");
const { data: existPts } = await sb.from("points_ledger").select("id").eq("member_id", mid).limit(1);
if (existPts?.length) { skip("points_ledger"); } else {
  const { error: pErr } = await sb.from("points_ledger").insert([
    { member_id: mid, entry_type: "earn",   points:  200, balance_after:  200, reason: "Annual membership reward",           created_at: "2026-01-15T08:00:00Z" },
    { member_id: mid, entry_type: "earn",   points:  150, balance_after:  350, reason: "Referral reward — 1 verified member",created_at: "2026-03-10T08:00:00Z" },
    { member_id: mid, entry_type: "earn",   points:  500, balance_after:  850, reason: "Loan release bonus",                  created_at: "2026-04-25T08:00:00Z" },
    { member_id: mid, entry_type: "redeem", points: -300, balance_after:  550, reason: "Redeemed: Service Fee Waiver",        created_at: "2026-05-01T08:00:00Z" },
  ]);
  if (pErr) fail("points_ledger", pErr.message);
  else ok("points_ledger", "4 entries — 550 net points");
}

// ── 5. Referrals ──────────────────────────────────────────────────
console.log("\n5. Referrals");
const { data: existRef } = await sb.from("referrals").select("id").eq("referrer_member_id", mid).limit(1);
if (existRef?.length) { skip("referrals"); } else {
  const { error: rErr } = await sb.from("referrals").insert([
    { referrer_member_id: mid, referral_code: "BMPC0001-A", invited_name: "Maria Santos",
      invited_contact: "maria.santos@email.com", status: "rewarded",
      reward_points_awarded: 150, verified_at: "2026-03-10T08:00:00Z", created_at: "2026-03-01T08:00:00Z" },
    { referrer_member_id: mid, referral_code: "BMPC0001-B", invited_name: "Jose Reyes",
      invited_contact: "jose.reyes@email.com", status: "registered",
      reward_points_awarded: 0, created_at: "2026-04-15T08:00:00Z" },
    { referrer_member_id: mid, referral_code: "BMPC0001-C", invited_name: "Ana Cruz",
      invited_contact: "ana.cruz@email.com", status: "invited",
      reward_points_awarded: 0, created_at: "2026-05-10T08:00:00Z" },
  ]);
  if (rErr) fail("referrals", rErr.message);
  else ok("referrals", "3 rows — 1 rewarded, 1 registered, 1 invited");
}

// ── 6. Insurance ──────────────────────────────────────────────────
console.log("\n6. Insurance");
let { data: insProd } = await sb.from("insurance_products").select("id").eq("is_active", true).limit(1).single();
if (!insProd) {
  const { data: ip } = await sb.from("insurance_products").insert({
    name: "BMPC Group Life Insurance",
    provider: "Cooperative Insurance System of the Philippines",
    description: "Basic group life insurance for all active members.",
    default_coverage_months: 12, is_active: true
  }).select("id").single();
  insProd = ip;
}

const { data: existIns } = await sb.from("insurance_records").select("id").eq("member_id", mid).limit(1);
if (existIns?.length) { skip("insurance_records"); } else {
  const { error: iErr } = await sb.from("insurance_records").insert({
    member_id: mid, product_id: insProd?.id,
    policy_number: "BMPC-INS-2026-0001",
    provider: "CISP",
    coverage_amount: 100000.00, premium_amount: 1200.00,
    effective_date: "2026-01-01", expiry_date: "2026-12-31",
    status: "active", metadata: {}
  });
  if (iErr) fail("insurance_records", iErr.message);
  else ok("insurance_records", "1 row — active until Dec 2026");
}

// ── 7. Mortuary record ────────────────────────────────────────────
console.log("\n7. Mortuary record");
const { data: existMort } = await sb.from("mortuary_records").select("id").eq("member_id", mid).limit(1);
if (existMort?.length) { skip("mortuary_records"); } else {
  const { error: mErr } = await sb.from("mortuary_records").insert({
    member_id: mid, status: "active",
    effective_date: "2024-01-01",
    beneficiary_name: "Rosa Dela Cruz",
    beneficiary_relationship: "Spouse",
    beneficiary_contact: "09171234567",
    contribution_amount: 200.00,
    claim_ready_data: {}
  });
  if (mErr) fail("mortuary_records", mErr.message);
  else ok("mortuary_records", "1 row — active, beneficiary set");
}

// ── 8. Notifications ──────────────────────────────────────────────
console.log("\n8. Notifications");
const { data: existNotif } = await sb.from("notifications").select("id").eq("member_id", mid).limit(1);
if (existNotif?.length) { skip("notifications"); } else {
  const { error: nErr } = await sb.from("notifications").insert([
    { member_id: mid, channel: "in_app", status: "sent",
      title: "Loan Released — ₱25,000",
      body: "Your Regular Loan application has been approved and released. Please check with the cashier.", metadata: {} },
    { member_id: mid, channel: "in_app", status: "sent",
      title: "Balance Updated — May 2026",
      body: "Your savings balance has been updated to ₱45,250.00 as of May 1, 2026.", metadata: {} },
    { member_id: mid, channel: "in_app", status: "queued",
      title: "Referral Registered",
      body: "Jose Reyes has registered using your referral code. Reward is pending verification.", metadata: {} },
  ]);
  if (nErr) fail("notifications", nErr.message);
  else ok("notifications", "3 rows");
}

console.log("\n✅ Done! Refresh the member portal to see the data.\n");
