import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireActiveMemberPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/account-pending");
  }

  if (profile.role === "staff" || profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.status !== "active") {
    redirect("/account-pending");
  }
}

export async function requireStaffOrAdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["staff", "admin"].includes(profile.role)) {
    redirect("/member");
  }

  if (profile.status !== "active") {
    redirect("/account-pending");
  }
}
