-- EventAlbum: guest profiles, release control, and personal scrapbooks
-- Paste into Supabase Dashboard → SQL Editor → Run

alter table public.events
  add column if not exists is_released boolean not null default false,
  add column if not exists scrapbook_theme text not null default 'editorial';

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_guests (
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guest_id, event_id)
);

create table if not exists public.guest_picks (
  guest_id uuid not null references public.guests (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guest_id, photo_id)
);

create table if not exists public.scrapbooks (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  theme text not null default 'editorial',
  created_at timestamptz not null default now()
);

create table if not exists public.scrapbook_items (
  id uuid primary key default gen_random_uuid(),
  scrapbook_id uuid not null references public.scrapbooks (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  position integer not null,
  chapter_title text,
  caption text,
  unique (scrapbook_id, photo_id)
);

alter table public.guests enable row level security;
alter table public.event_guests enable row level security;
alter table public.guest_picks enable row level security;
alter table public.scrapbooks enable row level security;
alter table public.scrapbook_items enable row level security;
