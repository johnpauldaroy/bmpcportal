import { Inbox } from "@/components/ui/icon";

type EmptyStateProps = {
  title: string;
  text: string;
};

export function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center">
      <Inbox className="mx-auto text-[#94A3B8]" aria-hidden size={36} />
      <h2 className="mt-4 text-base font-semibold text-[#0F172A]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#475569]">{text}</p>
    </div>
  );
}
