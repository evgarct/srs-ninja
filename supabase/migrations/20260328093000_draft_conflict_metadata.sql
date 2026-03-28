alter table public.notes
  add column if not exists draft_conflict jsonb null;
