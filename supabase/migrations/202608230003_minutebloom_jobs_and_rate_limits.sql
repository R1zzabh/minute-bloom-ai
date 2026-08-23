create table if not exists public.meeting_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (
    status in ('queued', 'processing', 'completed', 'failed')
  ),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  locked_by text,
  last_error text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meeting_processing_jobs_status_available_idx
  on public.meeting_processing_jobs (status, available_at);

create index if not exists meeting_processing_jobs_lease_idx
  on public.meeting_processing_jobs (lease_expires_at)
  where status = 'processing';

drop trigger if exists meeting_processing_jobs_set_updated_at on public.meeting_processing_jobs;
create trigger meeting_processing_jobs_set_updated_at
before update on public.meeting_processing_jobs
for each row execute function public.set_updated_at();

alter table public.meeting_processing_jobs enable row level security;

create table if not exists public.shared_rate_limits (
  scope text primary key,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default now(),
  window_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_rate_limits_window_ends_idx
  on public.shared_rate_limits (window_ends_at);

drop trigger if exists shared_rate_limits_set_updated_at on public.shared_rate_limits;
create trigger shared_rate_limits_set_updated_at
before update on public.shared_rate_limits
for each row execute function public.set_updated_at();

alter table public.shared_rate_limits enable row level security;

create or replace function public.claim_meeting_processing_job(
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns table (
  id uuid,
  meeting_id uuid,
  user_id uuid,
  attempt_count integer,
  max_attempts integer
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_worker_id is null or btrim(p_worker_id) = '' then
    raise exception 'p_worker_id is required';
  end if;

  if p_lease_seconds <= 0 then
    raise exception 'p_lease_seconds must be positive';
  end if;

  return query
  with next_job as (
    select job.id
    from public.meeting_processing_jobs as job
    join public.meetings as meeting on meeting.id = job.meeting_id
    where meeting.status <> 'completed'
      and job.attempt_count < job.max_attempts
      and (
        (job.status = 'queued' and job.available_at <= now())
        or (
          job.status = 'processing'
          and coalesce(job.lease_expires_at, '-infinity'::timestamptz) <= now()
        )
      )
    order by job.available_at asc, job.updated_at asc
    for update skip locked
    limit 1
  )
  update public.meeting_processing_jobs as job
  set status = 'processing',
      attempt_count = job.attempt_count + 1,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      locked_by = p_worker_id,
      last_error = null,
      started_at = coalesce(job.started_at, now()),
      finished_at = null,
      last_heartbeat_at = now(),
      updated_at = now()
  from next_job
  where job.id = next_job.id
  returning job.id, job.meeting_id, job.user_id, job.attempt_count, job.max_attempts;
end;
$$;

create or replace function public.consume_rate_limit_token(
  p_scope text,
  p_max_requests integer,
  p_window_seconds integer,
  p_now timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_existing public.shared_rate_limits%rowtype;
begin
  if p_scope is null or btrim(p_scope) = '' then
    raise exception 'p_scope is required';
  end if;

  if p_max_requests <= 0 then
    raise exception 'p_max_requests must be positive';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be positive';
  end if;

  loop
    select *
    into v_existing
    from public.shared_rate_limits
    where scope = p_scope
    for update;

    if found then
      if v_existing.window_ends_at <= p_now then
        update public.shared_rate_limits
        set request_count = 1,
            window_started_at = p_now,
            window_ends_at = p_now + make_interval(secs => p_window_seconds),
            updated_at = p_now
        where scope = p_scope;

        return true;
      end if;

      if v_existing.request_count >= p_max_requests then
        return false;
      end if;

      update public.shared_rate_limits
      set request_count = v_existing.request_count + 1,
          updated_at = p_now
      where scope = p_scope;

      return true;
    end if;

    begin
      insert into public.shared_rate_limits (
        scope,
        request_count,
        window_started_at,
        window_ends_at
      )
      values (
        p_scope,
        1,
        p_now,
        p_now + make_interval(secs => p_window_seconds)
      );

      return true;
    exception
      when unique_violation then
        null;
    end;
  end loop;
end;
$$;

revoke all on function public.claim_meeting_processing_job(text, integer) from public, anon, authenticated;
grant execute on function public.claim_meeting_processing_job(text, integer) to service_role;

revoke all on function public.consume_rate_limit_token(text, integer, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_rate_limit_token(text, integer, integer, timestamptz) to service_role;
