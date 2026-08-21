-- Student feedback and homework are private, server-managed records. Browser
-- roles have no direct table or Storage access; Vercel uses the service key.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  category text not null check (char_length(category) between 1 and 120),
  message text not null check (char_length(message) between 1 and 4000),
  page text not null default '' check (char_length(page) <= 1000),
  image_path text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

create table if not exists public.homework_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_section_id uuid references public.class_sections(id) on delete set null,
  class_code text not null default '',
  original_name text not null,
  storage_bucket text not null default 'homework',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 4194304),
  extracted_text text not null default '',
  generated_practice jsonb not null default '[]'::jsonb,
  processing_status text not null default 'ready'
    check (processing_status in ('uploaded', 'processing', 'ready', 'failed')),
  processing_note text not null default '',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists homework_documents_user_created_idx
  on public.homework_documents (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('feedback', 'feedback', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('homework', 'homework', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.feedback enable row level security;
alter table public.homework_documents enable row level security;

revoke all on public.feedback, public.homework_documents from anon, authenticated;
