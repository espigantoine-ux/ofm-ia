import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { StatusEditor } from "./status-editor";
import { NotesEditor } from "./notes-editor";
import { OpenConversationButton } from "./open-conversation-button";
import { PLATFORM_LABELS } from "@/lib/creator-status";
import type { Creator, CreatorStatus, Conversation, Message, Platform } from "@/lib/types/database";

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: creatorData } = await supabase.from("creators").select("*").eq("id", id).maybeSingle();
  const creator = creatorData as Creator | null;
  if (!creator) notFound();

  const { data: conversationData } = await supabase
    .from("conversations")
    .select("*")
    .eq("creator_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const conversation = conversationData as Conversation | null;

  let messages: Message[] = [];
  if (conversation) {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    messages = (messagesData ?? []) as Message[];
  }

  return (
    <>
      <Topbar title={creator.display_name || creator.handle} description={`@${creator.handle}`} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-5">
          <Badge variant="outline">{PLATFORM_LABELS[creator.platform as Platform]}</Badge>
          <Badge variant="secondary" className="capitalize">
            {creator.source === "inbound" ? "Candidature entrante" : "Prospection"}
          </Badge>
          <StatusEditor creatorId={creator.id} initialStatus={creator.status as CreatorStatus} />
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Ajouté le {new Date(creator.created_at).toLocaleDateString("fr-FR")}</span>
            <OpenConversationButton
              creatorId={creator.id}
              platform={creator.platform as Platform}
              existingConversationId={conversation?.id ?? null}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Profil" value={creator.profile_url} isLink />
          <InfoRow label="Email de contact" value={creator.contact_email} />
          <InfoRow label="Dernier contact" value={creator.last_contact_at ? new Date(creator.last_contact_at).toLocaleDateString("fr-FR") : null} />
        </div>

        {creator.application_answers && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">Réponses de candidature</p>
            <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
              {Object.entries(creator.application_answers).map(([k, v]) =>
                v ? (
                  <p key={k}>
                    <span className="text-foreground">{k} :</span> {String(v)}
                  </p>
                ) : null
              )}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Notes internes</p>
          <NotesEditor creatorId={creator.id} initialNotes={creator.notes} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Historique des échanges</p>
          <div className="flex flex-col gap-2">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Aucun échange pour l&apos;instant.</p>}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                  m.sender === "creator" ? "self-start border border-border bg-background" : "self-end bg-primary/10"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {m.sender === "creator" ? "Créateur" : m.sender === "agent" ? "Équipe" : "Brouillon IA"} ·{" "}
                  {new Date(m.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string | null; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
          {value}
        </a>
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}
