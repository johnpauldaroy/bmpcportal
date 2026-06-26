import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

const createSchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(80)
});

export async function GET(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.admin
    .from("branches")
    .select("id, code, name, is_active, created_at")
    .order("name", { ascending: true });

  if (error) return jsonError("Unable to fetch branches.", 500);

  return jsonOk({ branches: data });
}

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-branches",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid branch details.");

  const { data, error } = await auth.admin
    .from("branches")
    .insert({ code: parsed.data.code, name: parsed.data.name })
    .select("id, code, name, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return jsonError("A branch with that code already exists.", 409);
    return jsonError("Unable to create branch.", 500);
  }

  return jsonOk({ branch: data }, 201);
}
