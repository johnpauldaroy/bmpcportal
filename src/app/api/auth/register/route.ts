import { registrationSchema } from "@/features/auth/schemas";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "auth-register",
    limit: 8,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid registration details.");
  }

  const admin = createAdminClient();
  const { email, password, fullName, memberNumber, phone, cifKey } = parsed.data;

  // Re-verify CIF key is still unclaimed and matches the member number
  const { data: cif } = await admin
    .from("cif_records")
    .select("id, is_claimed")
    .eq("cif_key", cifKey)
    .eq("member_number", memberNumber)
    .maybeSingle();

  if (!cif) {
    return jsonError("CIF verification mismatch. Please restart the registration process.", 400);
  }

  if (cif.is_claimed) {
    return jsonError("This CIF key has already been used to register an account.", 409);
  }

  const existingProfile = await admin
    .from("profiles")
    .select("id")
    .eq("member_number", memberNumber)
    .maybeSingle();

  if (existingProfile.error) {
    return jsonError("Unable to verify member number.", 500);
  }

  if (existingProfile.data) {
    return jsonError("This member number is already registered.", 409);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      member_number: memberNumber
    }
  });

  if (authError || !authData.user) {
    return jsonError(authError?.message ?? "Unable to create member account.", 409);
  }

  const profileInsert = await admin.from("profiles").insert({
    id: authData.user.id,
    member_number: memberNumber,
    role: "member",
    status: "pending",
    full_name: fullName,
    email,
    phone
  });

  if (profileInsert.error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return jsonError("Unable to create pending member profile.", 500);
  }

  // Mark CIF as claimed so it cannot be reused
  await admin
    .from("cif_records")
    .update({ is_claimed: true, claimed_at: new Date().toISOString() })
    .eq("id", cif.id);

  return jsonOk({ userId: authData.user.id }, 201);
}
