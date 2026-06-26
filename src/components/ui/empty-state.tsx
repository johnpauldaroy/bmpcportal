import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  text: string;
};

export function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd7e3] bg-white p-8 text-center">
      <Inbox className="mx-auto text-[#8aa0b2]" aria-hidden size={30} />
      <h2 className="mt-4 text-base font-semibold text-[#10233f]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f6c7b]">{text}</p>
    </div>
  );
}
