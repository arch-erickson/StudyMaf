-- Private source documents and cumulative analytics for StudyMAF Control.
-- Browser users can upload only via a short-lived authenticated request; source
-- documents and extracted textbook sections are never exposed through the Data API.

create table if not exists public.account_activity_daily (
  day date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  study_seconds bigint not null default 0,
  calculator_uses integer not null default 0,
  learn_seconds bigint not null default 0,
  practice_seconds bigint not null default 0,
  test_seconds bigint not null default 0,
  study_mode_seconds bigint not null default 0,
  online_seconds bigint not null default 0,
  offline_seconds bigint not null default 0,
  primary key (day, user_id)
);

create index if not exists account_activity_daily_user_day_idx
  on public.account_activity_daily (user_id, day desc);

create or replace function public.rollup_studymaf_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.account_activity_daily (
    day, user_id, study_seconds, calculator_uses, learn_seconds,
    practice_seconds, test_seconds, study_mode_seconds, online_seconds, offline_seconds
  ) values (
    new.occurred_at::date,
    new.user_id,
    case when new.event_type = 'study_time' then new.duration_seconds else 0 end,
    case when new.event_type = 'calculator_use' then 1 else 0 end,
    case when new.event_type = 'study_time' and new.study_mode = 'learn' then new.duration_seconds else 0 end,
    case when new.event_type = 'study_time' and new.study_mode = 'practice' then new.duration_seconds else 0 end,
    case when new.event_type = 'study_time' and new.study_mode = 'test' then new.duration_seconds else 0 end,
    case when new.event_type = 'study_time' and new.study_mode = 'study' then new.duration_seconds else 0 end,
    case when new.event_type = 'study_time' and new.delivery_mode = 'online' then new.duration_seconds else 0 end,
    case when new.event_type = 'study_time' and new.delivery_mode = 'offline' then new.duration_seconds else 0 end
  )
  on conflict (day, user_id) do update set
    study_seconds = account_activity_daily.study_seconds + excluded.study_seconds,
    calculator_uses = account_activity_daily.calculator_uses + excluded.calculator_uses,
    learn_seconds = account_activity_daily.learn_seconds + excluded.learn_seconds,
    practice_seconds = account_activity_daily.practice_seconds + excluded.practice_seconds,
    test_seconds = account_activity_daily.test_seconds + excluded.test_seconds,
    study_mode_seconds = account_activity_daily.study_mode_seconds + excluded.study_mode_seconds,
    online_seconds = account_activity_daily.online_seconds + excluded.online_seconds,
    offline_seconds = account_activity_daily.offline_seconds + excluded.offline_seconds;
  return new;
end;
$$;

drop trigger if exists on_studymaf_activity_event_rollup on public.account_activity_events;
create trigger on_studymaf_activity_event_rollup
  after insert on public.account_activity_events
  for each row execute function public.rollup_studymaf_activity_event();

insert into public.account_activity_daily (
  day, user_id, study_seconds, calculator_uses, learn_seconds,
  practice_seconds, test_seconds, study_mode_seconds, online_seconds, offline_seconds
)
select
  occurred_at::date,
  user_id,
  sum(case when event_type = 'study_time' then duration_seconds else 0 end),
  count(*) filter (where event_type = 'calculator_use'),
  sum(case when event_type = 'study_time' and study_mode = 'learn' then duration_seconds else 0 end),
  sum(case when event_type = 'study_time' and study_mode = 'practice' then duration_seconds else 0 end),
  sum(case when event_type = 'study_time' and study_mode = 'test' then duration_seconds else 0 end),
  sum(case when event_type = 'study_time' and study_mode = 'study' then duration_seconds else 0 end),
  sum(case when event_type = 'study_time' and delivery_mode = 'online' then duration_seconds else 0 end),
  sum(case when event_type = 'study_time' and delivery_mode = 'offline' then duration_seconds else 0 end)
from public.account_activity_events
group by occurred_at::date, user_id
on conflict (day, user_id) do update set
  study_seconds = excluded.study_seconds,
  calculator_uses = excluded.calculator_uses,
  learn_seconds = excluded.learn_seconds,
  practice_seconds = excluded.practice_seconds,
  test_seconds = excluded.test_seconds,
  study_mode_seconds = excluded.study_mode_seconds,
  online_seconds = excluded.online_seconds,
  offline_seconds = excluded.offline_seconds;

create table if not exists public.course_documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course_catalog(id) on delete cascade,
  kind text not null check (kind in ('syllabus', 'textbook')),
  original_name text not null,
  storage_bucket text not null default 'course-source',
  storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null check (size_bytes >= 0),
  processing_status text not null default 'queued' check (processing_status in ('uploaded', 'queued', 'processing', 'ready', 'needs_review', 'failed')),
  processing_note text not null default '',
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists course_documents_course_uploaded_idx
  on public.course_documents (course_id, uploaded_at desc);

create table if not exists public.course_text_sections (
  id uuid primary key default gen_random_uuid(),
  course_document_id uuid not null references public.course_documents(id) on delete cascade,
  course_id uuid not null references public.course_catalog(id) on delete cascade,
  section_order integer not null check (section_order >= 0),
  title text not null default '',
  page_start integer,
  page_end integer,
  content text not null,
  token_count integer not null default 0 check (token_count >= 0),
  created_at timestamptz not null default now(),
  unique (course_document_id, section_order)
);

create index if not exists course_text_sections_course_order_idx
  on public.course_text_sections (course_id, course_document_id, section_order);

create table if not exists public.course_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course_catalog(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'needs_review', 'failed')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  message text not null default '',
  output jsonb not null default '{}'::jsonb
);

create index if not exists course_ingestion_jobs_course_requested_idx
  on public.course_ingestion_jobs (course_id, requested_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-source', 'course-source', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_studymaf_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'::public.studymaf_role
  );
$$;

revoke all on function private.is_studymaf_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_studymaf_admin() to authenticated;

drop policy if exists "StudyMAF admins upload course PDFs" on storage.objects;
create policy "StudyMAF admins upload course PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-source'
  and private.is_studymaf_admin()
);

alter table public.account_activity_daily enable row level security;
alter table public.course_documents enable row level security;
alter table public.course_text_sections enable row level security;
alter table public.course_ingestion_jobs enable row level security;

revoke all on public.account_activity_daily, public.course_documents,
  public.course_text_sections, public.course_ingestion_jobs from anon, authenticated;
revoke execute on function public.rollup_studymaf_activity_event() from public, anon, authenticated;
