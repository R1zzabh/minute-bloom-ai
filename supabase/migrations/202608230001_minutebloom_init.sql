create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  language text not null default 'auto',
  original_file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  duration_seconds numeric,
  status text not null check (
    status in ('uploading', 'uploaded', 'transcribing', 'summarizing', 'completed', 'failed')
  ),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  transcript_text text,
  transcript_segments jsonb not null default '[]'::jsonb,
  summary jsonb,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  owner text,
  due_date date,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('open', 'in_progress', 'done')),
  source_timestamp_seconds numeric,
  is_inferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_user_created_at_idx
  on public.meetings (user_id, created_at desc);
create index if not exists meetings_user_status_idx
  on public.meetings (user_id, status);
create index if not exists meetings_title_search_idx
  on public.meetings using gin (title gin_trgm_ops);
create index if not exists action_items_meeting_idx
  on public.action_items (meeting_id);
create index if not exists action_items_user_status_idx
  on public.action_items (user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meetings_set_updated_at on public.meetings;
create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

drop trigger if exists action_items_set_updated_at on public.action_items;
create trigger action_items_set_updated_at
before update on public.action_items
for each row execute function public.set_updated_at();

alter table public.meetings enable row level security;
alter table public.action_items enable row level security;

create policy "meetings_select_own"
on public.meetings
for select
to authenticated
using (auth.uid() = user_id);

create policy "meetings_insert_own"
on public.meetings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "meetings_update_own"
on public.meetings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "meetings_delete_own"
on public.meetings
for delete
to authenticated
using (auth.uid() = user_id);

create policy "action_items_select_own"
on public.action_items
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
  )
);

create policy "action_items_insert_own"
on public.action_items
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
  )
);

create policy "action_items_update_own"
on public.action_items
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
  )
);

create policy "action_items_delete_own"
on public.action_items
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('meeting-audio', 'meeting-audio', false)
on conflict (id) do nothing;

create policy "storage_select_own_meeting_audio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_insert_own_meeting_audio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_update_own_meeting_audio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_delete_own_meeting_audio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);
