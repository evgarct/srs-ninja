create table if not exists public.review_session_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  deck_id uuid not null references public.decks(id) on delete cascade,
  session_type text not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists review_session_completions_user_completed_idx
  on public.review_session_completions (user_id, completed_at desc);

create index if not exists review_session_completions_deck_completed_idx
  on public.review_session_completions (deck_id, completed_at desc);

alter table public.review_session_completions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'review_session_completions'
      and policyname = 'Users manage own review session completions'
  ) then
    create policy "Users manage own review session completions"
      on public.review_session_completions
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
