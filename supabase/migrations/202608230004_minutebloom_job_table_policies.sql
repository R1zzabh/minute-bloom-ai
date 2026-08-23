create index if not exists meeting_processing_jobs_user_id_idx
  on public.meeting_processing_jobs (user_id);

drop policy if exists "meeting_processing_jobs_no_client_access" on public.meeting_processing_jobs;
create policy "meeting_processing_jobs_no_client_access"
on public.meeting_processing_jobs
for all
to authenticated
using (false)
with check (false);

drop policy if exists "shared_rate_limits_no_client_access" on public.shared_rate_limits;
create policy "shared_rate_limits_no_client_access"
on public.shared_rate_limits
for all
to authenticated
using (false)
with check (false);
