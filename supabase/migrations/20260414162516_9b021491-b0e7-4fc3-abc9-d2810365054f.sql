create table public.translation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_language text not null,
  target_language text not null,
  messages jsonb not null default '[]',
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.translation_sessions enable row level security;

create policy "Users can view own translation sessions"
  on public.translation_sessions for select
  to authenticated using (user_id = auth.uid());

create policy "Users can insert own translation sessions"
  on public.translation_sessions for insert
  to authenticated with check (user_id = auth.uid());

create policy "Users can update own translation sessions"
  on public.translation_sessions for update
  to authenticated using (user_id = auth.uid());

create index idx_translation_sessions_user_id on public.translation_sessions(user_id);
create index idx_translation_sessions_created_at on public.translation_sessions(created_at desc);