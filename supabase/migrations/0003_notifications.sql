-- Phase 3 — notifications temps réel.
-- Générées côté base (triggers), pas côté client : fiables même si
-- l'insertion du message/rendez-vous passe par une route API ou un insert
-- direct du navigateur (RLS "staff"), sans dépendre de code applicatif
-- dupliqué à chaque point d'écriture.

-- Persistance de l'analyse IA (intent/refus) sur le message lui-même —
-- affiché comme badge dans le centre de conversation, et utilisé par
-- app/api/ai/draft/route.ts pour notifier "intervention_requise" (ce cas
-- ne peut pas être détecté par un trigger SQL, l'information vient du
-- modèle, pas d'une colonne déductible des autres colonnes).
alter table messages add column intent text;
alter table messages add column is_refusal boolean not null default false;

create or replace function notify_all_staff(p_type text, p_payload jsonb)
returns void as $$
begin
  insert into notifications (recipient_id, type, payload)
  select id, p_type, p_payload from staff_profiles;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- messages : nouveau message reçu / réponse IA prête
-- ---------------------------------------------------------------------------
create or replace function handle_message_notification()
returns trigger as $$
begin
  if new.sender = 'creator' then
    perform notify_all_staff(
      'nouveau_message',
      jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id, 'preview', left(new.content, 140))
    );
  elsif new.sender = 'ai_draft' and new.status = 'pending_review' then
    perform notify_all_staff(
      'reponse_ia_prete',
      jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id, 'preview', left(new.content, 140))
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_message_insert_notify
  after insert on messages
  for each row execute function handle_message_notification();

-- ---------------------------------------------------------------------------
-- appointments : rendez-vous proposé / confirmé
-- ---------------------------------------------------------------------------
create or replace function handle_appointment_notification()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform notify_all_staff('rdv_propose', jsonb_build_object('appointment_id', new.id, 'creator_id', new.creator_id));
  elsif tg_op = 'UPDATE' and new.status = 'confirmee' and old.status is distinct from 'confirmee' then
    perform notify_all_staff('rdv_confirme', jsonb_build_object('appointment_id', new.id, 'creator_id', new.creator_id));
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_appointment_change_notify
  after insert or update on appointments
  for each row execute function handle_appointment_notification();

-- ---------------------------------------------------------------------------
-- Realtime : la cloche de notifications s'abonne aux inserts sur sa propre
-- ligne (recipient_id = auth.uid()) via postgres_changes.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table notifications;
