alter table public.notes
  add column if not exists status text not null default 'approved',
  add column if not exists source text not null default 'manual',
  add column if not exists import_batch_id uuid null;

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  deck_id uuid not null references public.decks(id) on delete cascade,
  source text not null default 'mcp_ai_import',
  status text not null default 'draft',
  input_payload jsonb null,
  model_name text null,
  prompt_version text null,
  topic text null,
  requested_tags text[] not null default '{}',
  notes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_status_idx on public.notes (status);
create index if not exists notes_deck_status_idx on public.notes (deck_id, status);
create index if not exists notes_import_batch_id_idx on public.notes (import_batch_id);
create index if not exists import_batches_user_id_idx on public.import_batches (user_id);
create index if not exists import_batches_deck_id_idx on public.import_batches (deck_id);

alter table public.notes
  drop constraint if exists notes_import_batch_id_fkey;

alter table public.notes
  add constraint notes_import_batch_id_fkey
  foreign key (import_batch_id)
  references public.import_batches(id)
  on delete set null;

alter table public.import_batches enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'import_batches'
      and policyname = 'Users manage own import batches'
  ) then
    create policy "Users manage own import batches"
      on public.import_batches
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'tr_import_batches_updated_at'
  ) then
    create trigger tr_import_batches_updated_at
      before update on public.import_batches
      for each row
      execute function public.update_updated_at();
  end if;
end
$$;
