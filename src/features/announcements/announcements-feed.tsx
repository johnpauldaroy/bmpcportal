import { CalendarDays, Info, MapPin, Megaphone, Pin, Wrench } from "lucide-react";
import type { Announcement, AnnouncementType } from "./data";
import { formatAnnouncementDate } from "./data";

const typeConfig: Record<
  AnnouncementType,
  { label: string; icon: React.ElementType; bg: string; color: string; badge: string }
> = {
  news: {
    label: "News",
    icon: Megaphone,
    bg: "#e5f3ef",
    color: "#136f63",
    badge: "#136f63"
  },
  event: {
    label: "Event",
    icon: CalendarDays,
    bg: "#e5edf9",
    color: "#2563eb",
    badge: "#2563eb"
  },
  advisory: {
    label: "Advisory",
    icon: Info,
    bg: "#fffbe5",
    color: "#b45309",
    badge: "#d99b2b"
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    bg: "#fef2f2",
    color: "#b42318",
    badge: "#b42318"
  }
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <article
      className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: item.is_pinned ? config.badge : "#e1e8ef" }}
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
              style={{ background: "#fff7e6", color: "#b45309" }}
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

      <h3 className="mt-3 text-sm font-bold text-[#10233f] leading-snug">{item.title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-[#5f6c7b] line-clamp-3">{item.body}</p>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {item.event_date && (
          <span className="flex items-center gap-1 text-xs text-[#5f6c7b]">
            <CalendarDays size={12} className="shrink-0" />
            {formatAnnouncementDate(item.event_date)}
          </span>
        )}
        {item.event_location && (
          <span className="flex items-center gap-1 text-xs text-[#5f6c7b]">
            <MapPin size={12} className="shrink-0" />
            {item.event_location}
          </span>
        )}
        {item.published_at && !item.event_date && (
          <span className="text-xs text-[#8a99a8]">
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
      <div className="rounded-xl border border-dashed border-[#d8e1ea] bg-white p-8 text-center">
        <Megaphone className="mx-auto text-[#c8d5e0]" size={32} />
        <p className="mt-3 text-sm font-medium text-[#8a99a8]">No announcements yet</p>
        <p className="mt-1 text-xs text-[#a8b9c6]">Check back later for updates from BMPC.</p>
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
