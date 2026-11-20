-- OFM AI — schéma initial.
-- Outil interne mono-agence (pas de multi-tenant) : toute l'équipe staff
-- authentifiée a accès à l'ensemble du CRM. Le cloisonnement important
-- n'est pas entre utilisateurs staff, mais entre ce que l'app peut écrire
-- côté "anon" (rien, sauf /apply) et ce qui exige une session staff.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- staff_profiles
-- ---------------------------------------------------------------------------
create table staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table staff_profiles enable row level security;

create policy "staff_profiles_select_authenticated" on staff_profiles
  for select to authenticated using (true);

create policy "staff_profiles_update_own" on staff_profiles
  for update to authenticated using (id = auth.uid());

-- Auto-création du profil staff à l'inscription (même pattern que les
-- autres projets de cette agence) — le premier compte créé n'est PAS admin
-- par défaut ; passer is_admin à true manuellement en base pour le tout
-- premier utilisateur.
create function handle_new_staff_user()
returns trigger as $$
begin
  insert into public.staff_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_staff_user();

-- ---------------------------------------------------------------------------
-- platform_configs — règles par plateforme, en base pour rester évolutif
-- sans redéploiement (voir lib/types/database.ts, PlatformConfig).
-- ---------------------------------------------------------------------------
create table platform_configs (
  platform text primary key check (platform in ('instagram', 'tiktok', 'x', 'autre')),
  display_name text not null,
  inbound_enabled boolean not null default true,
  outreach_enabled boolean not null default true,
  notes text,
  settings jsonb not null default '{}'::jsonb
);

alter table platform_configs enable row level security;

create policy "platform_configs_select_authenticated" on platform_configs
  for select to authenticated using (true);

create policy "platform_configs_update_admin" on platform_configs
  for update to authenticated using (
    exists (select 1 from staff_profiles where id = auth.uid() and is_admin)
  );

insert into platform_configs (platform, display_name, inbound_enabled, outreach_enabled, notes) values
  ('instagram', 'Instagram', true, true, 'Aucune API publique pour écrire en premier à un compte. Réponse aux candidatures entrantes uniquement via email, pas via DM automatisé.'),
  ('tiktok', 'TikTok', true, true, 'Aucune API de messagerie DM, même pour de l''inbound. Prospection et suivi manuels uniquement.'),
  ('x', 'X / Twitter', true, true, 'API DM existante mais payante et limitée côté outreach. Envoi manuel recommandé pour l''instant.'),
  ('autre', 'Autres canaux', true, true, null);

-- ---------------------------------------------------------------------------
-- creators — candidatures (inbound) + prospects repérés manuellement
-- (outreach), pipeline de statuts unique.
-- ---------------------------------------------------------------------------
create table creators (
  id uuid primary key default gen_random_uuid(),
  platform text not null references platform_configs (platform),
  source text not null check (source in ('inbound', 'outreach')),
  handle text not null,
  display_name text,
  profile_url text,
  contact_email text,
  status text not null default 'nouveau' check (
    status in ('nouveau', 'en_attente', 'contacte', 'interesse', 'refuse', 'signe')
  ),
  notes text,
  application_answers jsonb,
  added_by uuid references staff_profiles (id),
  created_at timestamptz not null default now(),
  last_contact_at timestamptz
);

create index creators_platform_idx on creators (platform);
create index creators_status_idx on creators (status);
create index creators_source_idx on creators (source);

alter table creators enable row level security;

-- Aucune policy INSERT pour "anon" : le formulaire public /apply passe
-- obligatoirement par le client admin (service_role), voir
-- lib/supabase/admin.ts et app/api/apply/route.ts. Le navigateur ne peut
-- jamais écrire directement dans cette table sans session staff.
create policy "creators_select_staff" on creators
  for select to authenticated using (true);

create policy "creators_insert_staff" on creators
  for insert to authenticated with check (true);

create policy "creators_update_staff" on creators
  for update to authenticated using (true);

create policy "creators_delete_staff" on creators
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- conversations / messages
-- ---------------------------------------------------------------------------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators (id) on delete cascade,
  -- Dénormalisé depuis creators.platform à la création (voir
  -- app/api/conversations/route.ts) : évite des jointures PostgREST
  -- multi-niveaux fragiles pour les compteurs du dashboard par plateforme.
  platform text not null references platform_configs (platform),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now()
);

create index conversations_creator_idx on conversations (creator_id);
create index conversations_platform_idx on conversations (platform);

alter table conversations enable row level security;

create policy "conversations_all_staff" on conversations
  for all to authenticated using (true) with check (true);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  -- Dénormalisé depuis conversations.platform, même raison que ci-dessus.
  platform text not null references platform_configs (platform),
  sender text not null check (sender in ('creator', 'agent', 'ai_draft')),
  content text not null,
  -- 'sent' est posé par un humain après envoi manuel réel sur la
  -- plateforme (ou après envoi email réussi pour l'inbound) — jamais par
  -- un job automatique. Voir contrainte produit : pas d'envoi auto.
  status text not null default 'draft' check (
    status in ('draft', 'pending_review', 'approved', 'sent', 'rejected')
  ),
  created_by uuid references staff_profiles (id),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index messages_conversation_idx on messages (conversation_id);
create index messages_platform_idx on messages (platform);
create index messages_status_idx on messages (status);

alter table messages enable row level security;

create policy "messages_all_staff" on messages
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators (id) on delete cascade,
  proposed_slots timestamptz[] not null default '{}',
  confirmed_slot timestamptz,
  status text not null default 'proposee' check (status in ('proposee', 'confirmee', 'annulee')),
  created_at timestamptz not null default now()
);

create index appointments_creator_idx on appointments (creator_id);

alter table appointments enable row level security;

create policy "appointments_all_staff" on appointments
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- notifications — propres à chaque membre du staff (contrairement aux
-- autres tables), donc policy "own row" cette fois.
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references staff_profiles (id) on delete cascade,
  type text not null check (
    type in ('nouveau_message', 'reponse_analysee', 'reponse_ia_prete', 'rdv_propose', 'rdv_confirme', 'intervention_requise')
  ),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on notifications (recipient_id, read_at);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select to authenticated using (recipient_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update to authenticated using (recipient_id = auth.uid());

-- Insertion réservée au service_role (déclenchée par le code serveur lors
-- des événements produit), jamais directement par un client staff.
