import type { CreatorStatus, Platform } from "@/lib/types/database";

export const STATUS_LABELS: Record<CreatorStatus, string> = {
  nouveau: "Nouveau",
  en_attente: "En attente",
  contacte: "Contacté",
  interesse: "Intéressé",
  refuse: "Refusé",
  signe: "Signé",
};

export const STATUS_ORDER: CreatorStatus[] = ["nouveau", "en_attente", "contacte", "interesse", "refuse", "signe"];

export const STATUS_BADGE_VARIANT: Record<CreatorStatus, "default" | "secondary" | "outline" | "destructive"> = {
  nouveau: "outline",
  en_attente: "secondary",
  contacte: "secondary",
  interesse: "default",
  refuse: "destructive",
  signe: "default",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X / Twitter",
  autre: "Autre",
};
