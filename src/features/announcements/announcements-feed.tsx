import { CalendarDays, Info, MapPin, Megaphone, Pin, Wrench } from "@/components/ui/icon";
import type { Announcement, AnnouncementType } from "./data";
import { formatAnnouncementDate } from "./data";

const typeConfig: Record<
  AnnouncementType,
  { label: string; icon: React.ElementType; bg: string; color: string; badge: string }
> = {
  news: {
    label: "News",
    icon: Megaphone,
    bg: "#DAE7FF",
    color: "#3673FC",
    badge: "#3673FC"
  },
  event: {
    label: "Event",
    icon: CalendarDays,
    bg: "#EDE9FE",
    color: "#7C3AED",
    badge: "#7C3AED"
  },
  advisory: {
    label: "Advisory",
    icon: Info,
    bg: "#FEF3C7",
    color: "#B45309",
    badge: "#D97706"
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    bg: "#FEE2E2",
    color: "#DC2626",
    badge: "#DC2626"
  }
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <article
      className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: item.is_pinned ? config.badge : "#E2E8F0" }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Type icon */}
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: config.bg, color: config.color }}
        >
          <Icon size={18} />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {item.is_pinned && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "#F1F5F9", color: "#475569" }}
            >
              <Pin size={9} />
              Pinned
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: config.badge }}
          >
            {config.label}
          </span>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-bold text-[#0F172A] leading-snug">{item.title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-[#475569] line-clamp-3">{item.body}</p>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {item.event_date && (
          <span className="flex items-center gap-1 text-xs text-[#475569]">
            <CalendarDays size={12} className="shrink-0" />
            {formatAnnouncementDate(item.event_date)}
          </span>
        )}
        {item.event_location && (
          <span className="flex items-center gap-1 text-xs text-[#475569]">
            <MapPin size={12} className="shrink-0" />
            {item.event_location}
          </span>
        )}
        {item.published_at && !item.event_date && (
          <span className="text-xs text-[#94A3B8]">
            {formatAnnouncementDate(item.published_at)}
          </span>
        )}
      </div>
    </article>
  );
}

export function AnnouncementsFeed({ items }: { items: Announcement[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center">
        <Megaphone className="mx-auto text-[#CBD5E1]" size={32} />
        <p className="mt-3 text-sm font-medium text-[#94A3B8]">No announcements yet</p>
        <p className="mt-1 text-xs text-[#94A3B8]">Check back later for updates from BMPC.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <AnnouncementCard key={item.id} item={item} />
      ))}
    </div>
  );
}
