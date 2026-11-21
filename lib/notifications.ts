import type { NotificationType } from "@/lib/types/database";

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  nouveau_message: "Nouveau message reçu",
  reponse_analysee: "Réponse analysée",
  reponse_ia_prete: "Proposition IA prête",
  rdv_propose: "Rendez-vous proposé",
  rdv_confirme: "Rendez-vous confirmé",
  intervention_requise: "Intervention requise",
};

export function notificationLink(type: NotificationType, payload: Record<string, unknown>): string {
  if (payload.conversation_id) return `/dashboard/conversations/${payload.conversation_id}`;
  if (payload.creator_id) return `/dashboard/crm/${payload.creator_id}`;
  if (type === "rdv_propose" || type === "rdv_confirme") return "/dashboard/appointments";
  return "/dashboard";
}
