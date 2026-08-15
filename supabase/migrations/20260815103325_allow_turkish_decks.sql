alter table public.decks
  drop constraint if exists decks_language_check;

alter table public.decks
  add constraint decks_language_check
  check (language in ('czech', 'english', 'turkish'));
