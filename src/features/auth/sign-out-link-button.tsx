"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export function SignOutLinkButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button intent="secondary" onClick={signOut}>
      Sign out and use another account
    </Button>
  );
}
