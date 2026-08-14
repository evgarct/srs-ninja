alter table public.decks
  add column if not exists translation_language text not null default 'russian';

alter table public.decks
  drop constraint if exists decks_translation_language_check;

alter table public.decks
  add constraint decks_translation_language_check
  check (translation_language in ('russian', 'english', 'czech', 'turkish'));

alter table public.decks
  drop constraint if exists decks_language_pair_check;

alter table public.decks
  add constraint decks_language_pair_check
  check (language <> translation_language);
