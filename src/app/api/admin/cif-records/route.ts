import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

const createSchema = z.object({
  cif_key: z.string().trim().min(1).max(80),
  member_number: z.string().trim().min(1).max(40).toUpperCase(),
  branch_id: z.string().uuid()
});

export async function GET(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.admin
    .from("cif_records")
    .select("id, cif_key, member_number, branch_id, is_claimed, claimed_at, created_at, branches(code, name)")
    .order("created_at", { ascending: false });

  if (error) return jsonError("Unable to fetch CIF records.", 500);

  return jsonOk({ records: data });
}

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-cif-records",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);

  // Support single or bulk insert
  const isBulk = Array.isArray(body);
  const rows = isBulk ? body : [body];
  const parsed = z.array(createSchema).safeParse(rows);

  if (!parsed.success) return jsonError("Invalid CIF record details.");

  const { data, error } = await auth.admin
    .from("cif_records")
    .insert(parsed.data)
    .select("id, cif_key, member_number, branch_id, is_claimed, claimed_at, created_at, branches(code, name)");

  if (error) {
    if (error.code === "23505") return jsonError("One or more CIF keys or member numbers already exist.", 409);
    return jsonError("Unable to create CIF record.", 500);
  }

  return jsonOk({ records: data }, 201);
}
