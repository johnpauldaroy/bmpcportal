"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, UserPlus } from "@/components/ui/icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cifVerifySchema, registrationSchema, type CifVerifyInput, type RegistrationInput } from "./schemas";

type Branch = { code: string; name: string };
type VerifyResponse = { memberNumber?: string; error?: string };
type RegisterResponse = { userId?: string; error?: string };
type VerifiedData = { cifKey: string; memberNumber: string };

export function RegisterForm({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [verified, setVerified] = useState<VerifiedData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const verifyForm = useForm<CifVerifyInput>({
    resolver: zodResolver(cifVerifySchema)
  });

  const registerForm = useForm<Omit<RegistrationInput, "cifKey" | "memberNumber">>({
    resolver: zodResolver(
      registrationSchema.omit({ cifKey: true, memberNumber: true })
    )
  });

  async function onVerify(values: CifVerifyInput) {
    setMessage(null);
    const res = await fetch("/api/auth/verify-cif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const payload = (await res.json().catch(() => ({}))) as VerifyResponse;

    if (!res.ok) {
      setMessage(payload.error ?? "Verification failed.");
      return;
    }

    setVerified({ cifKey: values.cifKey, memberNumber: payload.memberNumber! });
    setStep(2);
  }

  async function onRegister(values: Omit<RegistrationInput, "cifKey" | "memberNumber">) {
    if (!verified) return;
    setMessage(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        cifKey: verified.cifKey,
        memberNumber: verified.memberNumber
      })
    });
    const payload = (await res.json().catch(() => ({}))) as RegisterResponse;

    if (!res.ok) {
      setMessage(payload.error ?? "Registration failed.");
      return;
    }

    router.replace("/account-pending");
    router.refresh();
  }

  if (step === 1) {
    return (
      <form className="mt-5 grid gap-4" onSubmit={verifyForm.handleSubmit(onVerify)}>
        <div className="rounded-lg bg-[#DAE7FF] border border-[#BDD6FF] px-4 py-3">
          <p className="text-xs leading-5 text-[#173DDE]">
            Enter the <strong>CIF key</strong> and <strong>branch</strong> provided by
            your cooperative. This confirms your membership before creating an account.
          </p>
        </div>

        <label className="grid gap-1 text-sm font-medium text-[#334155]">
          CIF Key
          <input
            className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3 font-mono tracking-wider uppercase"
            autoComplete="off"
            placeholder="e.g. BMPC-2024-XXXXX"
            {...verifyForm.register("cifKey")}
          />
          {verifyForm.formState.errors.cifKey && (
            <span className="text-xs text-[#b42318]">
              {verifyForm.formState.errors.cifKey.message}
            </span>
          )}
        </label>

        <label className="grid gap-1 text-sm font-medium text-[#334155]">
          Branch
          <select
            className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3 bg-white"
            {...verifyForm.register("branchCode")}
            defaultValue=""
          >
            <option value="" disabled>Select your branch</option>
            {branches.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
          {verifyForm.formState.errors.branchCode && (
            <span className="text-xs text-[#b42318]">
              {verifyForm.formState.errors.branchCode.message}
            </span>
          )}
        </label>

        {message && <p className="text-sm text-[#b42318]">{message}</p>}

        <Button type="submit" disabled={verifyForm.formState.isSubmitting}>
          {verifyForm.formState.isSubmitting ? "Verifying..." : "Verify Membership"}
          {!verifyForm.formState.isSubmitting && <ArrowRight aria-hidden size={16} />}
        </Button>
      </form>
    );
  }

  return (
    <form className="mt-5 grid gap-4" onSubmit={registerForm.handleSubmit(onRegister)}>
      {verified && (
        <div className="flex items-center gap-2 rounded-lg bg-[#DAE7FF] border border-[#BDD6FF] px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 text-[#3673FC]" />
          <p className="text-xs leading-5 text-[#173DDE]">
            Membership verified — Member No. <strong>{verified.memberNumber}</strong>
          </p>
        </div>
      )}

      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Full name
        <input
          className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3"
          autoComplete="name"
          {...registerForm.register("fullName")}
        />
        {registerForm.formState.errors.fullName && (
          <span className="text-xs text-[#b42318]">
            {registerForm.formState.errors.fullName.message}
          </span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Email
        <input
          className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3"
          type="email"
          autoComplete="email"
          {...registerForm.register("email")}
        />
        {registerForm.formState.errors.email && (
          <span className="text-xs text-[#b42318]">
            {registerForm.formState.errors.email.message}
          </span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Phone
        <input
          className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3"
          autoComplete="tel"
          {...registerForm.register("phone")}
        />
        {registerForm.formState.errors.phone && (
          <span className="text-xs text-[#b42318]">
            {registerForm.formState.errors.phone.message}
          </span>
        )}
      </label>

      <label className="grid gap-1 text-sm font-medium text-[#334155]">
        Password
        <input
          className="focus-ring min-h-11 rounded-md border border-[#E2E8F0] px-3"
          type="password"
          autoComplete="new-password"
          {...registerForm.register("password")}
        />
        {registerForm.formState.errors.password && (
          <span className="text-xs text-[#b42318]">
            {registerForm.formState.errors.password.message}
          </span>
        )}
      </label>

      {message && <p className="text-sm text-[#b42318]">{message}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          intent="secondary"
          onClick={() => { setStep(1); setMessage(null); }}
        >
          <ArrowLeft aria-hidden size={16} />
          Back
        </Button>
        <Button type="submit" disabled={registerForm.formState.isSubmitting}>
          <UserPlus aria-hidden size={16} />
          {registerForm.formState.isSubmitting ? "Submitting..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
