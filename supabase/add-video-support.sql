-- EventAlbum: mark photo rows as images or videos
-- Paste into Supabase Dashboard → SQL Editor → Run

alter table public.photos
  add column if not exists media_type text not null default 'image',
  add column if not exists poster_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'photos_media_type_check'
      and conrelid = 'public.photos'::regclass
  ) then
    alter table public.photos
      add constraint photos_media_type_check
      check (media_type in ('image', 'video'));
  end if;
end;
$$;
