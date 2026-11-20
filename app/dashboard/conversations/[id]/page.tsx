import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { MessageItem } from "./message-item";
import { AiDraftButton } from "./ai-draft-button";
import { LogIncomingForm } from "./log-incoming-form";
import { ManualComposeForm } from "./manual-compose-form";
import { ConversationControls } from "./conversation-controls";
import { PLATFORM_LABELS, STATUS_LABELS, STATUS_BADGE_VARIANT } from "@/lib/creator-status";
import type { Conversation, Creator, Message, CreatorStatus, Platform } from "@/lib/types/database";

export default async function ConversationThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: conversationData } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  const conversation = conversationData as Conversation | null;
  if (!conversation) notFound();

  const { data: creatorData } = await supabase.from("creators").select("*").eq("id", conversation.creator_id).single();
  const creator = creatorData as Creator;

  const { data: messagesData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  const messages = (messagesData ?? []) as Message[];

  const { data: settingsData } = await supabase.from("app_settings").select("ai_paused").eq("id", true).single();
  const aiPaused = settingsData?.ai_paused ?? false;

  const hasPendingDraft = messages.some((m) => m.status === "pending_review" || m.status === "approved");

  return (
    <>
      <Topbar
        title={creator.display_name || creator.handle}
        description={`@${creator.handle} · ${PLATFORM_LABELS[creator.platform as Platform]}`}
      />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[creator.status as CreatorStatus]}>{STATUS_LABELS[creator.status as CreatorStatus]}</Badge>
            <Badge variant="outline" className="capitalize">
              Conversation {conversation.status === "active" ? "active" : conversation.status === "paused" ? "en pause" : "archivée"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ConversationControls conversationId={conversation.id} status={conversation.status} />
            <Link href={`/dashboard/crm/${creator.id}`} className="text-xs text-primary underline">
              Voir la fiche
            </Link>
          </div>
        </div>

        {aiPaused && (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
            Génération IA en pause globale — réactive-la depuis les Paramètres pour proposer de nouvelles réponses.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">Aucun échange pour l&apos;instant.</p>}
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <AiDraftButton
            conversationId={conversation.id}
            disabled={aiPaused || conversation.status !== "active" || hasPendingDraft}
          />
          {hasPendingDraft && (
            <p className="text-xs text-muted-foreground">
              Traite la proposition en attente ci-dessus avant d&apos;en générer une nouvelle.
            </p>
          )}
          <LogIncomingForm conversationId={conversation.id} platform={creator.platform as Platform} />
          <ManualComposeForm conversationId={conversation.id} platform={creator.platform as Platform} />
        </div>
      </main>
    </>
  );
}
