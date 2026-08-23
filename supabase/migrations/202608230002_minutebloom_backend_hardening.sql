create schema if not exists extensions;

alter extension pg_trgm set schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "meetings_select_own" on public.meetings;
create policy "meetings_select_own"
on public.meetings
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "meetings_insert_own" on public.meetings;
create policy "meetings_insert_own"
on public.meetings
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "meetings_update_own" on public.meetings;
create policy "meetings_update_own"
on public.meetings
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "meetings_delete_own" on public.meetings;
create policy "meetings_delete_own"
on public.meetings
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "action_items_select_own" on public.action_items;
create policy "action_items_select_own"
on public.action_items
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = (select auth.uid())
  )
);

drop policy if exists "action_items_insert_own" on public.action_items;
create policy "action_items_insert_own"
on public.action_items
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = (select auth.uid())
  )
);

drop policy if exists "action_items_update_own" on public.action_items;
create policy "action_items_update_own"
on public.action_items
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = (select auth.uid())
  )
);

drop policy if exists "action_items_delete_own" on public.action_items;
create policy "action_items_delete_own"
on public.action_items
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.meetings
    where meetings.id = action_items.meeting_id
      and meetings.user_id = (select auth.uid())
  )
);

drop policy if exists "storage_select_own_meeting_audio" on storage.objects;
create policy "storage_select_own_meeting_audio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

drop policy if exists "storage_insert_own_meeting_audio" on storage.objects;
create policy "storage_insert_own_meeting_audio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

drop policy if exists "storage_update_own_meeting_audio" on storage.objects;
create policy "storage_update_own_meeting_audio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
)
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

drop policy if exists "storage_delete_own_meeting_audio" on storage.objects;
create policy "storage_delete_own_meeting_audio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
      'audio/mpeg',
      'audio/mp4',
      'audio/mpga',
      'audio/m4a',
      'audio/wav',
      'audio/webm',
      'video/mp4'
    ]::text[]
where id = 'meeting-audio';
