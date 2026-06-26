import { StatusBadge } from "@/components/ui/status-badge";
import { BackButton } from "@/components/ui/back-button";

type PageHeaderProps = {
  title: string;
  description: string;
  status?: string;
  backHref?: string;
  showBack?: boolean;
};

export function PageHeader({ title, description, status, backHref, showBack = true }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {showBack && <BackButton href={backHref} />}
      {status ? (
        <StatusBadge tone="neutral" className="mb-3">
          {status}
        </StatusBadge>
      ) : null}
      <h1 className="text-2xl font-semibold text-[#10233f]">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6c7b]">{description}</p>
    </header>
  );
}
