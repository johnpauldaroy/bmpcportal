import Link from "next/link";
import type { LinkProps } from "next/link";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonIntent = "primary" | "secondary" | "danger";

const intentClass: Record<ButtonIntent, string> = {
  primary: "bg-[#136f63] text-white hover:bg-[#0b4f47]",
  secondary: "border border-[#cbd7e3] bg-white text-[#17263a] hover:bg-[#edf3f8]",
  danger: "bg-[#b42318] text-white hover:bg-[#8f1f16]"
};

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
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        intentClass[intent],
        className
      )}
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
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        intentClass[intent],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
