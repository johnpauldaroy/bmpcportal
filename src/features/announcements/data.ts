import { createClient } from "@/lib/supabase/server";

export type AnnouncementType = "news" | "event" | "advisory" | "maintenance";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  event_date: string | null;
  event_location: string | null;
};

export async function getPublishedAnnouncements(limit = 6): Promise<Announcement[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, type, is_pinned, is_published, published_at, event_date, event_location")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as Announcement[];
  } catch {
    return [];
  }
}

export function formatAnnouncementDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila"
  }).format(new Date(date));
}
