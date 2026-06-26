create type public.announcement_type as enum ('news', 'event', 'advisory', 'maintenance');

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type public.announcement_type not null default 'news',
  is_pinned boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  event_date date,
  event_location text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Members can read published announcements; only staff/admin can write
alter table public.announcements enable row level security;

create policy "Members can read published announcements"
  on public.announcements for select
  using (is_published = true);

create policy "Staff and admin can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('staff', 'admin')
    )
  );

-- Seed a few sample announcements
insert into public.announcements (title, body, type, is_pinned, is_published, published_at, event_date, event_location)
values
  (
    'General Assembly 2026',
    'All members are invited to attend the BMPC Annual General Assembly on June 15, 2026 at the Barbaza Municipal Hall. Registration starts at 8:00 AM.',
    'event',
    true,
    true,
    now(),
    '2026-06-15',
    'Barbaza Municipal Hall'
  ),
  (
    'Loan Interest Rate Update',
    'Effective July 1, 2026, regular loan interest rates will be adjusted to 1.5% per month. Please review the updated loan products in the portal.',
    'advisory',
    false,
    true,
    now(),
    null,
    null
  ),
  (
    'Portal Maintenance Notice',
    'The BMPC Portal will undergo scheduled maintenance on May 30, 2026 from 10 PM to 2 AM. Services will be temporarily unavailable during this window.',
    'maintenance',
    false,
    true,
    now(),
    null,
    null
  ),
  (
    'Welcome to the New BMPC Portal!',
    'We are excited to launch our new member portal. You can now view your balances, apply for loans, check insurance, and access all cooperative services online.',
    'news',
    true,
    true,
    now(),
    null,
    null
  );
