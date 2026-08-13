-- Account provisioning and private learning analytics for StudyMAF Control.
-- The browser never receives direct table access; the Vercel server verifies every request.

create table if not exists public.account_role_invites (
  email text primary key,
  role public.studymaf_role not null default 'professor',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint account_role_invites_professor_only check (role = 'professor'::public.studymaf_role),
  constraint account_role_invites_email_lower check (email = lower(email))
);

create table if not exists public.account_activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_section_id uuid references public.class_sections(id) on delete set null,
  class_key text not null default '',
  class_name text not null default '',
  course_code text not null default '',
  lesson_id text not null default '',
  event_type text not null check (event_type in ('study_time', 'calculator_use')),
  study_mode text not null default 'study' check (study_mode in ('study', 'learn', 'practice', 'test')),
  delivery_mode text not null default 'offline' check (delivery_mode in ('offline', 'online')),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 300),
  occurred_at timestamptz not null default now()
);

create index if not exists account_activity_events_user_time_idx
  on public.account_activity_events (user_id, occurred_at desc);
create index if not exists account_activity_events_section_time_idx
  on public.account_activity_events (class_section_id, occurred_at desc);
create index if not exists account_activity_events_user_class_lesson_idx
  on public.account_activity_events (user_id, class_key, lesson_id, occurred_at desc);
create index if not exists account_role_invites_created_by_idx
  on public.account_role_invites (created_by);

alter table public.account_role_invites enable row level security;
alter table public.account_activity_events enable row level security;
revoke all on public.account_role_invites, public.account_activity_events from anon, authenticated;

-- A professor added before they sign in becomes a professor on their first verified login.
create or replace function public.handle_studymaf_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_role public.studymaf_role;
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, updated_at = now();

  select role into invited_role
  from public.account_role_invites
  where email = lower(new.email);

  if invited_role is not null then
    insert into public.user_roles (user_id, role)
    values (new.id, invited_role)
    on conflict (user_id) do update set role = excluded.role, assigned_at = now();
    delete from public.account_role_invites where email = lower(new.email);
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'student')
    on conflict (user_id) do nothing;
  end if;

  update public.class_enrollments
    set student_id = new.id,
        status = case when status = 'removed' then 'removed' else 'active' end,
        joined_at = coalesce(joined_at, now())
    where lower(student_email) = lower(new.email)
      and student_id is null;
  return new;
end;
$$;

revoke execute on function public.handle_studymaf_user_created() from public, anon, authenticated;
