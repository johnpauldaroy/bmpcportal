import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://dxpphuixuhmxrzmlrgjk.supabase.co",
  "sb_secret_X5PmWsx2WYYqYgOZ9D4vIw_HGf7eBD7",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Check if table exists
const { data, error } = await sb.from("announcements").select("id").limit(1);

if (error && error.code === "42P01") {
  console.log("Table does not exist yet.");
  console.log("Please run the migration SQL in the Supabase dashboard SQL editor.");
  console.log("File: supabase/migrations/0005_announcements.sql");
} else if (error) {
  console.log("Unexpected error:", error.message);
} else {
  console.log("✓ announcements table exists, rows:", data.length);
  if (data.length === 0) {
    // Seed sample announcements
    const { error: seedError } = await sb.from("announcements").insert([
      {
        title: "General Assembly 2026",
        body: "All members are invited to attend the BMPC Annual General Assembly on June 15, 2026 at the Barbaza Municipal Hall. Registration starts at 8:00 AM.",
        type: "event",
        is_pinned: true,
        is_published: true,
        published_at: new Date().toISOString(),
        event_date: "2026-06-15",
        event_location: "Barbaza Municipal Hall"
      },
      {
        title: "Loan Interest Rate Update",
        body: "Effective July 1, 2026, regular loan interest rates will be adjusted to 1.5% per month. Please review the updated loan products in the portal.",
        type: "advisory",
        is_pinned: false,
        is_published: true,
        published_at: new Date().toISOString()
      },
      {
        title: "Portal Maintenance Notice",
        body: "The BMPC Portal will undergo scheduled maintenance on May 30, 2026 from 10 PM to 2 AM. Services will be temporarily unavailable during this window.",
        type: "maintenance",
        is_pinned: false,
        is_published: true,
        published_at: new Date().toISOString()
      },
      {
        title: "Welcome to the New BMPC Portal!",
        body: "We are excited to launch our new member portal. You can now view your balances, apply for loans, check insurance, and access all cooperative services online.",
        type: "news",
        is_pinned: true,
        is_published: true,
        published_at: new Date().toISOString()
      }
    ]);
    if (seedError) {
      console.log("Seed error:", seedError.message);
    } else {
      console.log("✓ Seeded 4 sample announcements");
    }
  } else {
    console.log("Already has data, skipping seed.");
  }
}
