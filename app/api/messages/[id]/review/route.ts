import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types/database";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), content: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject") }),
  // Posé par l'humain après avoir réellement envoyé le message, manuellement,
  // sur la plateforme — jamais déclenché par un envoi automatique. Même
  // contrainte que le ContactLogger du CRM.
  z.object({ action: z.literal("mark_sent") }),
]);

// `id` = messages.id. Les 3 actions de contrôle du brief (valider /
// modifier / refuser) + une 4e, mark_sent, pour fermer la boucle une fois
// le message réellement envoyé à la main.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { data: messageData } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
  const message = messageData as Message | null;
  if (!message) {
    return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
  }

  let update: Partial<Message> = {};
  if (parsed.data.action === "edit") {
    if (message.status !== "pending_review") {
      return NextResponse.json({ error: "Seul un brouillon en attente peut être modifié." }, { status: 409 });
    }
    update = { content: parsed.data.content };
  } else if (parsed.data.action === "approve") {
    if (message.status !== "pending_review") {
      return NextResponse.json({ error: "Seul un brouillon en attente peut être validé." }, { status: 409 });
    }
    update = { status: "approved" };
  } else if (parsed.data.action === "reject") {
    if (message.status !== "pending_review" && message.status !== "approved") {
      return NextResponse.json({ error: "Ce message ne peut plus être refusé." }, { status: 409 });
    }
    update = { status: "rejected" };
  } else {
    if (message.status !== "approved") {
      return NextResponse.json({ error: "Seul un message validé peut être marqué comme envoyé." }, { status: 409 });
    }
    update = { status: "sent", sent_at: new Date().toISOString() };
  }

  const { data: updated, error } = await supabase.from("messages").update(update).eq("id", id).select().single();
  if (error || !updated) {
    return NextResponse.json({ error: "Impossible de mettre à jour le message." }, { status: 500 });
  }

  if (parsed.data.action === "mark_sent") {
    const { data: conversation } = await supabase.from("conversations").select("creator_id").eq("id", message.conversation_id).single();
    if (conversation) {
      await supabase
        .from("creators")
        .update({ last_contact_at: new Date().toISOString(), status: "contacte" })
        .eq("id", conversation.creator_id)
        .in("status", ["nouveau", "en_attente"]);
    }
  }

  return NextResponse.json({ message: updated });
}
