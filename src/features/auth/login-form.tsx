"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "@/components/ui/icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { loginSchema, type LoginInput } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(values);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .single();

    if (!profile || profile.status !== "active") {
      router.replace("/account-pending");
      router.refresh();
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const safeRequestedPath =
      requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : null;
    const defaultPath = ["staff", "admin"].includes(profile.role) ? "/admin" : "/member";

    router.replace(safeRequestedPath ?? defaultPath);
    router.refresh();
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Email Address
        <input
          className="focus-ring min-h-11 rounded-lg border border-[#E2E8F0] px-3 bg-white transition-colors focus:border-[#3673FC]"
          type="email"
          autoComplete="email"
          placeholder="juan@email.com"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-[#b42318]">{errors.email.message}</span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Password
        <div className="relative">
          <input
            className="focus-ring min-h-11 w-full rounded-lg border border-[#E2E8F0] px-3 pr-11 bg-white transition-colors focus:border-[#3673FC]"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-[#b42318]">{errors.password.message}</span>
        )}
      </label>

      {error && (
        <div className="rounded-lg bg-[#fef2f2] border border-[#fecaca] p-3">
          <p className="text-sm text-[#b42318]">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1 min-h-11 w-full text-base">
        <LogIn aria-hidden size={18} />
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
