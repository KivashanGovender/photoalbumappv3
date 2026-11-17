-- EventAlbum: AI curation columns on photos
-- Paste into Supabase Dashboard → SQL Editor → Run

alter table public.photos
  add column if not exists is_culled boolean not null default false,
  add column if not exists cull_reason text,
  add column if not exists chapter_title text,
  add column if not exists ai_caption text,
  add column if not exists analyzed_at timestamptz;

create index if not exists photos_unanalyzed_idx
  on public.photos (event_id, created_at)
  where analyzed_at is null;
