-- EventAlbum: saved album layout and hybrid guest reads
-- Run after supabase/photos-curation.sql and supabase/album-social.sql.
-- Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Hosts are authenticated users (events.host_id).
-- Guests are cookie profiles in public.event_guests, not auth users.
-- A guest read of a private event needs the request header x-guest-id set to
-- that cookie's guest id. Public and released events stay readable without it.
-- The service role bypasses these policies.

-- Saved layout on the event. The app writes scrapbook_theme and is_released.
-- The trigger copies those values to template_id and is_published.
alter table public.events
  add column if not exists template_id text,
  add column if not exists subtitle text,
  add column if not exists is_published boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.events
set
  template_id = coalesce(template_id, scrapbook_theme, 'editorial'),
  is_published = is_released
where template_id is null
   or is_published is distinct from is_released;

alter table public.scrapbooks
  add column if not exists template_id text,
  add column if not exists subtitle text,
  add column if not exists is_published boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.scrapbooks
set template_id = coalesce(template_id, theme, 'editorial')
where template_id is null;

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  invited_email text,
  invite_token text,
  role text not null default 'guest',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint event_participants_role_check check (role in ('host', 'guest')),
  constraint event_participants_identity_check check (user_id is not null or invited_email is not null)
);

-- The table may already exist without these columns. CREATE TABLE above does not add them.
alter table public.event_participants
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists invited_email text,
  add column if not exists invite_token text,
  add column if not exists role text not null default 'guest',
  add column if not exists accepted_at timestamptz;

create unique index if not exists event_participants_event_user_key
  on public.event_participants (event_id, user_id)
  where user_id is not null;

create unique index if not exists event_participants_event_email_key
  on public.event_participants (event_id, lower(invited_email))
  where invited_email is not null;

create unique index if not exists event_participants_invite_token_key
  on public.event_participants (invite_token)
  where invite_token is not null;

insert into public.event_participants (event_id, user_id, role, accepted_at)
select events.id, events.host_id, 'host', now()
from public.events
where events.host_id is not null
  and not exists (
    select 1
    from public.event_participants participants
    where participants.event_id = events.id
      and participants.user_id = events.host_id
  );

create or replace function public.sync_event_album_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.template_id := coalesce(new.template_id, new.scrapbook_theme, 'editorial');
    new.scrapbook_theme := coalesce(new.scrapbook_theme, new.template_id, 'editorial');
    new.is_published := coalesce(new.is_published, new.is_released, false);
    new.is_released := coalesce(new.is_released, new.is_published, false);
  else
    if new.template_id is distinct from old.template_id then
      new.scrapbook_theme := coalesce(new.template_id, new.scrapbook_theme);
    elsif new.scrapbook_theme is distinct from old.scrapbook_theme then
      new.template_id := coalesce(new.scrapbook_theme, new.template_id);
    end if;

    if new.is_published is distinct from old.is_published then
      new.is_released := new.is_published;
    elsif new.is_released is distinct from old.is_released then
      new.is_published := new.is_released;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists events_sync_album_fields on public.events;
create trigger events_sync_album_fields
before insert or update on public.events
for each row
execute function public.sync_event_album_fields();

create or replace function public.sync_scrapbook_album_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.template_id := coalesce(new.template_id, new.theme, 'editorial');
    new.theme := coalesce(new.theme, new.template_id, 'editorial');
  else
    if new.template_id is distinct from old.template_id then
      new.theme := coalesce(new.template_id, new.theme);
    elsif new.theme is distinct from old.theme then
      new.template_id := coalesce(new.theme, new.template_id);
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists scrapbooks_sync_album_fields on public.scrapbooks;
create trigger scrapbooks_sync_album_fields
before insert or update on public.scrapbooks
for each row
execute function public.sync_scrapbook_album_fields();

-- Cookie guest id from the x-guest-id request header. Invalid values return null
-- so a bad header cannot fail the query.
create or replace function public.request_guest_id()
returns uuid
language plpgsql
stable
as $$
declare
  raw text;
begin
  raw := nullif(current_setting('request.headers', true)::json->>'x-guest-id', '');

  if raw is null or raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;

  return raw::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.is_event_host(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.events
      where id = target_event
        and host_id = auth.uid()
    );
$$;

create or replace function public.is_event_guest(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.request_guest_id() is not null
    and exists (
      select 1
      from public.event_guests
      where event_id = target_event
        and guest_id = public.request_guest_id()
    );
$$;

create or replace function public.is_event_shared(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where id = target_event
      and is_public
  );
$$;

create or replace function public.can_read_event(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_event_host(target_event)
    or public.is_event_guest(target_event)
    or public.is_event_shared(target_event);
$$;

revoke all on function public.request_guest_id() from public;
revoke all on function public.is_event_host(uuid) from public;
revoke all on function public.is_event_guest(uuid) from public;
revoke all on function public.is_event_shared(uuid) from public;
revoke all on function public.can_read_event(uuid) from public;
grant execute on function public.request_guest_id() to anon, authenticated;
grant execute on function public.is_event_host(uuid) to anon, authenticated;
grant execute on function public.is_event_guest(uuid) to anon, authenticated;
grant execute on function public.is_event_shared(uuid) to anon, authenticated;
grant execute on function public.can_read_event(uuid) to anon, authenticated;

create or replace function public.claim_event_invite(token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_event uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in before claiming an invite';
  end if;

  if token is null or length(token) < 16 then
    raise exception 'Invite is not valid';
  end if;

  update public.event_participants
  set
    user_id = auth.uid(),
    accepted_at = coalesce(accepted_at, now())
  where invite_token = token
    and (user_id is null or user_id = auth.uid())
  returning event_id into claimed_event;

  if claimed_event is null then
    raise exception 'Invite is not valid';
  end if;

  return claimed_event;
end;
$$;

revoke all on function public.claim_event_invite(text) from public;
grant execute on function public.claim_event_invite(text) to authenticated;

alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.scrapbooks enable row level security;
alter table public.event_participants enable row level security;

-- Replace SELECT policies with the hybrid host, cookie-guest, and public rules.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('events', 'photos', 'scrapbooks')
      and cmd = 'SELECT'
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  end loop;
end;
$$;

drop policy if exists events_member_select on public.events;
drop policy if exists events_read on public.events;
create policy events_read
on public.events
for select
to anon, authenticated
using (public.can_read_event(id));

drop policy if exists events_host_insert on public.events;
create policy events_host_insert
on public.events
for insert
to authenticated
with check (host_id = auth.uid());

drop policy if exists events_host_update on public.events;
create policy events_host_update
on public.events
for update
to authenticated
using (host_id = auth.uid())
with check (host_id = auth.uid());

drop policy if exists events_host_delete on public.events;
create policy events_host_delete
on public.events
for delete
to authenticated
using (host_id = auth.uid());

drop policy if exists photos_member_select on public.photos;
drop policy if exists photos_read on public.photos;
create policy photos_read
on public.photos
for select
to anon, authenticated
using (
  public.can_read_event(event_id)
  and (public.is_event_host(event_id) or coalesce(is_culled, false) = false)
);

drop policy if exists photos_guest_insert on public.photos;
create policy photos_guest_insert
on public.photos
for insert
to anon, authenticated
with check (
  public.is_event_host(event_id)
  or public.is_event_guest(event_id)
  or public.is_event_shared(event_id)
);

drop policy if exists photos_host_update on public.photos;
create policy photos_host_update
on public.photos
for update
to authenticated
using (public.is_event_host(event_id))
with check (public.is_event_host(event_id));

drop policy if exists photos_host_delete on public.photos;
create policy photos_host_delete
on public.photos
for delete
to authenticated
using (public.is_event_host(event_id));

drop policy if exists scrapbooks_member_select on public.scrapbooks;
drop policy if exists scrapbooks_read on public.scrapbooks;
-- Personal scrapbooks stay with the host or the cookie guest who owns the row.
-- A public or released event does not open every guest's scrapbook.
create policy scrapbooks_read
on public.scrapbooks
for select
to anon, authenticated
using (
  public.is_event_host(event_id)
  or (
    guest_id = public.request_guest_id()
    and public.is_event_guest(event_id)
  )
);

drop policy if exists event_participants_select on public.event_participants;
create policy event_participants_select
on public.event_participants
for select
to authenticated
using (user_id = auth.uid() or public.is_event_host(event_id));

drop policy if exists event_participants_host_insert on public.event_participants;
create policy event_participants_host_insert
on public.event_participants
for insert
to authenticated
with check (public.is_event_host(event_id));

drop policy if exists event_participants_host_update on public.event_participants;
create policy event_participants_host_update
on public.event_participants
for update
to authenticated
using (public.is_event_host(event_id))
with check (public.is_event_host(event_id));

drop policy if exists event_participants_host_delete on public.event_participants;
create policy event_participants_host_delete
on public.event_participants
for delete
to authenticated
using (public.is_event_host(event_id));
