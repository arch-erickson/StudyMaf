-- Private StudyMAF tutor memory. These tables are accessed only by the server
-- through its service-role key; browser roles receive no grants or policies.
create table if not exists public.tutor_problem_memory (
  problem_key text primary key,
  lesson_id text not null,
  wrong_count integer not null default 0 check (wrong_count >= 0),
  help_level integer not null default 0 check (help_level between 0 and 3),
  latest_misconception text,
  last_wrong_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.tutor_attempts (
  id bigint generated always as identity primary key,
  problem_key text not null references public.tutor_problem_memory(problem_key) on delete cascade,
  lesson_id text not null,
  outcome text not null check (outcome in ('wrong', 'correct')),
  misconception text,
  created_at timestamptz not null default now()
);

create index if not exists tutor_attempts_problem_created_idx
  on public.tutor_attempts (problem_key, created_at desc);

alter table public.tutor_problem_memory enable row level security;
alter table public.tutor_attempts enable row level security;

revoke all on public.tutor_problem_memory from anon, authenticated;
revoke all on public.tutor_attempts from anon, authenticated;
