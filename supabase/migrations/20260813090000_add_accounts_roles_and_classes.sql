-- StudyMAF accounts, roles, course catalogue, sections, and student rosters.
-- These are deliberately server-managed: browser roles receive no table grants.

do $$ begin
  create type public.studymaf_role as enum ('student', 'professor', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.studymaf_role not null default 'student',
  assigned_at timestamptz not null default now()
);

create table if not exists public.course_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  subject text not null,
  description text not null default '',
  lessons jsonb not null default '[]'::jsonb,
  textbooks jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_catalog_code_upper check (code = upper(code))
);

create table if not exists public.class_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course_catalog(id) on delete restrict,
  professor_id uuid not null references public.profiles(id) on delete restrict,
  section_label text not null default 'Section 1',
  term text not null default '',
  join_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_sections_join_code_upper check (join_code = upper(join_code))
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references public.class_sections(id) on delete cascade,
  student_email text not null,
  student_id uuid references public.profiles(id) on delete set null,
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (class_section_id, student_email)
);

create index if not exists class_sections_professor_idx on public.class_sections(professor_id);
create index if not exists class_enrollments_student_idx on public.class_enrollments(student_id);
create index if not exists class_enrollments_email_lower_idx on public.class_enrollments(lower(student_email));

-- A new Supabase Auth user always receives a server-managed profile and student role.
-- Admins promote professors through the protected Vercel API.
create or replace function public.handle_studymaf_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  update public.class_enrollments
    set student_id = new.id,
        status = case when status = 'removed' then 'removed' else 'active' end,
        joined_at = coalesce(joined_at, now())
    where lower(student_email) = lower(new.email)
      and student_id is null;
  return new;
end;
$$;

drop trigger if exists on_studymaf_auth_user_created on auth.users;
create trigger on_studymaf_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_studymaf_user_created();

-- Existing users (created before this migration) get profiles/roles too.
insert into public.profiles (id, email, display_name)
select id, lower(email), coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
where email is not null
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'student'::public.studymaf_role from public.profiles
on conflict (user_id) do nothing;

-- Seed the currently authored course as the first selectable course template.
insert into public.course_catalog (code, title, subject, description, textbooks)
values (
  'PHYS1442',
  'PHYS 1442 — General Physics II',
  'physics',
  'Electricity, magnetism, waves, and optics.',
  '["University Physics Volume 2 — OpenStax", "University Physics Volume 3 — OpenStax"]'::jsonb
)
on conflict (code) do nothing;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.course_catalog enable row level security;
alter table public.class_sections enable row level security;
alter table public.class_enrollments enable row level security;

revoke all on public.profiles, public.user_roles, public.course_catalog, public.class_sections, public.class_enrollments from anon, authenticated;
revoke execute on function public.handle_studymaf_user_created() from public, anon, authenticated;
