import type { SupabaseClient } from "@supabase/supabase-js";
import type { Platform } from "@/lib/types/database";

// Compteurs réels (jamais de valeurs simulées) pour le dashboard global et
// les cartes par plateforme. `head: true` avec `count: "exact"` ne
// rapatrie aucune ligne — juste le total.

export interface GlobalStats {
  totalProspects: number;
  totalConversations: number;
  nouveauxMessages: number;
  reponsesEnAttente: number;
  rendezVous: number;
  collaborations: number;
}

export async function getGlobalStats(supabase: SupabaseClient): Promise<GlobalStats> {
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalProspects },
    { count: totalConversations },
    { count: nouveauxMessages },
    { count: reponsesEnAttente },
    { count: rendezVous },
    { count: collaborations },
  ] = await Promise.all([
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender", "creator")
      .gte("created_at", since48h),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).in("status", ["proposee", "confirmee"]),
    supabase.from("creators").select("*", { count: "exact", head: true }).eq("status", "signe"),
  ]);

  return {
    totalProspects: totalProspects ?? 0,
    totalConversations: totalConversations ?? 0,
    nouveauxMessages: nouveauxMessages ?? 0,
    reponsesEnAttente: reponsesEnAttente ?? 0,
    rendezVous: rendezVous ?? 0,
    collaborations: collaborations ?? 0,
  };
}

export interface PlatformStats {
  platform: Platform;
  prospects: number;
  messagesEnvoyes: number;
  reponsesRecues: number;
  messagesATraiter: number;
  conversationsActives: number;
}

export async function getPlatformStats(supabase: SupabaseClient, platform: Platform): Promise<PlatformStats> {
  const [
    { count: prospects },
    { count: messagesEnvoyes },
    { count: reponsesRecues },
    { count: messagesATraiter },
    { count: conversationsActives },
  ] = await Promise.all([
    supabase.from("creators").select("*", { count: "exact", head: true }).eq("platform", platform),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("platform", platform).eq("status", "sent"),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("platform", platform).eq("sender", "creator"),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("platform", platform)
      .eq("status", "pending_review"),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("platform", platform)
      .eq("status", "active"),
  ]);

  return {
    platform,
    prospects: prospects ?? 0,
    messagesEnvoyes: messagesEnvoyes ?? 0,
    reponsesRecues: reponsesRecues ?? 0,
    messagesATraiter: messagesATraiter ?? 0,
    conversationsActives: conversationsActives ?? 0,
  };
}
