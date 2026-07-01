import Link from "next/link";
import type { LucideIcon } from "@/components/ui/icon";

export type DashboardItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type PortalDashboardProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: DashboardItem[];
  headingLevel?: "h1" | "h2";
};

export function PortalDashboard({
  eyebrow,
  title,
  description,
  items,
  headingLevel = "h1"
}: PortalDashboardProps) {
  const Heading = headingLevel;

  return (
    <section className="py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3673FC]">
        {eyebrow}
      </p>
      <Heading className="mt-3 text-3xl font-semibold text-[#0F172A]">{title}</Heading>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#475569]">
        {description}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-[#E2E8F0] bg-white p-4 md-elevation-1 transition hover:border-[#94A3B8]"
          >
            <item.icon className="text-[#3673FC]" aria-hidden size={22} />
            <h2 className="mt-4 text-base font-semibold">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
