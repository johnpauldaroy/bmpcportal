import { CalendarDays, MapPin, Megaphone, Pin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, AnnouncementType } from "@/features/announcements/data";
import { formatAnnouncementDate } from "@/features/announcements/data";

const typeColors: Record<AnnouncementType, { bg: string; color: string }> = {
  news:        { bg: "#e5f3ef", color: "#136f63" },
  event:       { bg: "#e5edf9", color: "#2563eb" },
  advisory:    { bg: "#fffbe5", color: "#b45309" },
  maintenance: { bg: "#fef2f2", color: "#b42318" }
};

async function getAllAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, type, is_pinned, published_at, event_date, event_location, is_published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const items = await getAllAnnouncements();

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#136f63]">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-[#10233f]">Announcements</h1>
          <p className="mt-1 text-sm text-[#5f6c7b]">
            Manage news, events, and advisories shown to members.
          </p>
        </div>
        <a
          href="/admin/announcements/new"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: "#136f63" }}
        >
          <Plus size={16} />
          New Announcement
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: items.length },
          { label: "Published", value: items.filter((i) => i.is_published).length },
          { label: "Pinned", value: items.filter((i) => i.is_pinned).length },
          { label: "Events", value: items.filter((i) => i.type === "event").length }
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#d8e1ea] bg-white p-4 shadow-sm">
            <p className="text-xs text-[#8a99a8]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#10233f]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8e1ea] bg-white p-12 text-center">
          <Megaphone className="mx-auto text-[#c8d5e0]" size={36} />
          <p className="mt-3 font-medium text-[#8a99a8]">No announcements yet</p>
          <p className="mt-1 text-sm text-[#a8b9c6]">Create your first announcement to inform members.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const cfg = typeColors[item.type];
            return (
              <article
                key={item.id}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 shadow-sm"
                style={{ borderColor: item.is_pinned ? "#d99b2b" : "#e1e8ef" }}
              >
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <Megaphone size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#10233f]">{item.title}</h3>
                    {item.is_pinned && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#fff7e6", color: "#b45309" }}>
                        <Pin size={9} /> Pinned
                      </span>
                    )}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ background: cfg.color }}
                    >
                      {item.type}
                    </span>
                    {!item.is_published && (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: "#f0f4f8", color: "#8a99a8" }}>
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#5f6c7b] line-clamp-2">{item.body}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {item.event_date && (
                      <span className="flex items-center gap-1 text-xs text-[#5f6c7b]">
                        <CalendarDays size={11} /> {formatAnnouncementDate(item.event_date)}
                      </span>
                    )}
                    {item.event_location && (
                      <span className="flex items-center gap-1 text-xs text-[#5f6c7b]">
                        <MapPin size={11} /> {item.event_location}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
