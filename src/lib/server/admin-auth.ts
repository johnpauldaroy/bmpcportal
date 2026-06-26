import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireStaffOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json({ error: "Authentication is required." }, { status: 401 })
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !["staff", "admin"].includes(profile.role)) {
    return {
      response: NextResponse.json({ error: "Staff or admin access is required." }, { status: 403 })
    };
  }

  return {
    admin,
    user,
    profile
  };
}
