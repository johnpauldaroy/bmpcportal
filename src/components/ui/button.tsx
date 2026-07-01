import Link from "next/link";
import type { LinkProps } from "next/link";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonIntent = "primary" | "secondary" | "danger";

// Material-style buttons: full-pill shape, label tracking, state layer + press feedback.
const intentClass: Record<ButtonIntent, string> = {
  primary: "bg-[#3673FC] text-white hover:bg-[#1F52F1] md-elevation-1 hover:md-elevation-2",
  secondary: "border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F1F5F9]",
  danger: "bg-[#b42318] text-white hover:bg-[#8f1f16] md-elevation-1 hover:md-elevation-2"
};

const baseButton =
  "focus-ring md-interactive md-state-layer inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium tracking-[0.02em] disabled:pointer-events-none disabled:opacity-50";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: ButtonIntent;
};

export function Button({
  className,
  intent = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseButton, intentClass[intent], className)}
      {...props}
    />
  );
}

type ButtonLinkProps = PropsWithChildren<
  LinkProps & {
    className?: string;
    intent?: ButtonIntent;
  }
>;

export function ButtonLink({
  className,
  intent = "primary",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseButton, intentClass[intent], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
