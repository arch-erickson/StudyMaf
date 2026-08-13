-- Compact, per-account study progress. Browser roles have no direct access.
create table if not exists public.account_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint account_progress_state_object check (jsonb_typeof(state) = 'object')
);

alter table public.account_progress enable row level security;
revoke all on public.account_progress from anon, authenticated;
