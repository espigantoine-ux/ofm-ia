import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/ai-draft";
import type { Creator, Conversation, Message } from "@/lib/types/database";

// Génération IA (thinking) — même raison que les autres projets de cette
// agence pour le maxDuration : laisser le temps au modèle de réfléchir
// sans timeout prématuré.
export const maxDuration = 60;

const bodySchema = z.object({ conversationId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Pause globale (section 11 du brief) — vérifiée côté serveur, pas
  // seulement désactivée visuellement côté UI.
  const { data: settingsData } = await supabase.from("app_settings").select("ai_paused").eq("id", true).single();
  if (settingsData?.ai_paused) {
    return NextResponse.json({ error: "La génération IA est en pause globale." }, { status: 423 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { data: conversationData } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", parsed.data.conversationId)
    .maybeSingle();
  const conversation = conversationData as Conversation | null;
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  }
  if (conversation.status === "paused") {
    return NextResponse.json({ error: "Cette conversation est en pause." }, { status: 409 });
  }

  const { data: creatorData } = await supabase.from("creators").select("*").eq("id", conversation.creator_id).single();
  const creator = creatorData as Creator;

  const { data: historyData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });
  const history = (historyData ?? []) as Message[];

  let result;
  try {
    result = await generateDraft(creator, history);
  } catch {
    return NextResponse.json({ error: "Impossible de générer la proposition IA." }, { status: 500 });
  }

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      platform: creator.platform,
      sender: "ai_draft",
      content: result.draft,
      status: "pending_review",
      intent: result.intent,
      is_refusal: result.isRefusal,
    })
    .select()
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "Impossible d'enregistrer la proposition." }, { status: 500 });
  }

  // Cas que seul le modèle peut détecter (pas déductible par un trigger
  // SQL comme les autres notifications, voir migration 0003) : signale
  // explicitement qu'une intervention humaine est nécessaire.
  if (result.isRefusal) {
    const { data: staffRows } = await supabase.from("staff_profiles").select("id");
    if (staffRows && staffRows.length > 0) {
      await supabase.from("notifications").insert(
        staffRows.map((s) => ({
          recipient_id: s.id,
          type: "intervention_requise",
          payload: { conversation_id: conversation.id, message_id: inserted.id, reason: "refus_detecte" },
        }))
      );
    }
  }

  return NextResponse.json({
    message: inserted,
    intent: result.intent,
    isRefusal: result.isRefusal,
    suggestedStatus: result.suggestedStatus,
    teamNote: result.teamNote,
  });
}
