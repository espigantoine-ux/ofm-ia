export type Platform = "instagram" | "tiktok" | "x" | "autre";
export type CreatorSource = "inbound" | "outreach";
export type CreatorStatus =
  | "nouveau"
  | "en_attente"
  | "contacte"
  | "interesse"
  | "refuse"
  | "signe";

export interface StaffProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

// Configuration par plateforme, lue en base plutôt qu'en dur dans le code —
// permet de faire évoluer les règles (canal inbound actif, prospection
// autorisée...) sans redéploiement. Voir migration 0001.
export interface PlatformConfig {
  platform: Platform;
  display_name: string;
  inbound_enabled: boolean;
  outreach_enabled: boolean;
  // Note libre sur les contraintes de la plateforme (ex: "pas d'API DM
  // publique, prospection manuelle uniquement") — affichée dans l'UI pour
  // rappeler à l'équipe les règles en vigueur.
  notes: string | null;
  settings: Record<string, unknown>;
}

// Table unifiée candidature (inbound) + prospect repéré manuellement
// (outreach) — un seul pipeline de statuts pour les deux, voir le choix
// d'architecture (pas 2 CRM séparés par origine).
export interface Creator {
  id: string;
  platform: Platform;
  source: CreatorSource;
  handle: string;
  display_name: string | null;
  profile_url: string | null;
  contact_email: string | null;
  status: CreatorStatus;
  notes: string | null;
  // Réponses du formulaire /apply pour les candidatures inbound ; null pour
  // l'outreach (ajouté manuellement par l'équipe, pas de formulaire).
  application_answers: Record<string, unknown> | null;
  added_by: string | null;
  created_at: string;
  last_contact_at: string | null;
}

export type ConversationStatus = "active" | "paused" | "archived";

export interface Conversation {
  id: string;
  creator_id: string;
  // Dénormalisé depuis creators.platform à la création — voir migration
  // 0001, évite des jointures multi-niveaux pour les stats par plateforme.
  platform: Platform;
  status: ConversationStatus;
  created_at: string;
}

export type MessageSender = "creator" | "agent" | "ai_draft";
export type MessageStatus = "draft" | "pending_review" | "approved" | "sent" | "rejected";

// `sent` ne signifie jamais "envoyé automatiquement par l'app" — pour
// outreach et pour les plateformes sans API de messagerie, c'est l'humain
// qui envoie manuellement sur la plateforme puis marque le message comme
// envoyé ici. Voir lib/access.ts / app/api/messages pour la contrainte.
export interface Message {
  id: string;
  conversation_id: string;
  platform: Platform;
  sender: MessageSender;
  content: string;
  status: MessageStatus;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
  // Analyse IA persistée (migration 0003) — null pour les messages
  // sender='creator'/'agent', toujours renseigné pour sender='ai_draft'.
  intent: string | null;
  is_refusal: boolean;
}

export type AppointmentStatus = "proposee" | "confirmee" | "annulee";

export interface Appointment {
  id: string;
  creator_id: string;
  proposed_slots: string[];
  confirmed_slot: string | null;
  status: AppointmentStatus;
  created_at: string;
}

export type NotificationType =
  | "nouveau_message"
  | "reponse_analysee"
  | "reponse_ia_prete"
  | "rdv_propose"
  | "rdv_confirme"
  | "intervention_requise";

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
