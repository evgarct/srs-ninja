create table public.user_elevenlabs_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_api_key text not null,
  english_voice_id text,
  czech_voice_id text,
  turkish_voice_id text,
  account_tier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_elevenlabs_settings enable row level security;
revoke all on table public.user_elevenlabs_settings from anon, authenticated;
grant all on table public.user_elevenlabs_settings to service_role;

create trigger user_elevenlabs_settings_updated_at
before update on public.user_elevenlabs_settings
for each row execute function public.update_updated_at();
