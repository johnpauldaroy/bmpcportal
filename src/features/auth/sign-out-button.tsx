"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      className="min-h-0 rounded-lg p-2 text-[#8a99a8] hover:bg-[#edf3f8] hover:text-[#b42318]"
      intent="secondary"
      onClick={signOut}
      aria-label="Sign out"
    >
      <LogOut aria-hidden size={18} />
    </Button>
  );
}
