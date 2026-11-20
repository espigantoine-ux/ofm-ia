-- Phase 2 — IA de rédaction + centre de conversation.

-- Réglages globaux, une seule ligne. `ai_paused` est le bouton pause
-- globale (section 11 du brief) : vérifié côté serveur dans
-- app/api/ai/draft/route.ts avant toute génération, pas qu'un indicateur
-- visuel côté UI.
create table app_settings (
  id boolean primary key default true check (id),
  ai_paused boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into app_settings (id, ai_paused) values (true, false);

alter table app_settings enable row level security;

create policy "app_settings_select_authenticated" on app_settings
  for select to authenticated using (true);

create policy "app_settings_update_admin" on app_settings
  for update to authenticated using (
    exists (select 1 from staff_profiles where id = auth.uid() and is_admin)
  );
