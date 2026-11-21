"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types/database";

const SENDER_LABEL: Record<Message["sender"], string> = {
  creator: "Créateur",
  agent: "Équipe",
  ai_draft: "Proposition IA",
};

const STATUS_LABEL: Record<Message["status"], string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  approved: "Validé, à envoyer",
  sent: "Envoyé",
  rejected: "Refusé",
};

async function reviewAction(messageId: string, body: { action: string; content?: string }) {
  const res = await fetch(`/api/messages/${messageId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erreur.");
}

export function MessageItem({ message }: { message: Message }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(message.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, extra?: { content?: string }) {
    setBusy(true);
    setError(null);
    try {
      await reviewAction(message.id, { action, ...extra });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  const isFromCreator = message.sender === "creator";
  const needsReview = message.status === "pending_review";
  const needsSend = message.status === "approved";

  return (
    <div className={`flex flex-col gap-1.5 ${isFromCreator ? "items-start" : "items-end"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
          isFromCreator
            ? "border border-border bg-background"
            : message.status === "rejected"
              ? "border border-destructive/30 bg-destructive/5 opacity-60"
              : "bg-primary/10"
        }`}
      >
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {SENDER_LABEL[message.sender]} · {STATUS_LABEL[message.status]} · {new Date(message.created_at).toLocaleString("fr-FR")}
        </p>
        {message.intent && (
          <p className="mt-1 text-[10px] font-medium text-primary">
            Intention détectée : {message.intent}
            {message.is_refusal && <span className="text-destructive"> · refus détecté</span>}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {needsReview && !editing && (
        <div className="flex gap-1.5">
          <Button size="sm" disabled={busy} onClick={() => run("approve")}>
            Valider
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
            Modifier
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => run("reject")}>
            Refuser
          </Button>
        </div>
      )}

      {needsReview && editing && (
        <div className="flex gap-1.5">
          <Button size="sm" disabled={busy} onClick={() => run("edit", { content })}>
            Enregistrer la modification
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </div>
      )}

      {needsSend && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => run("mark_sent")}>
          {busy ? "..." : "Marquer comme envoyé (après envoi manuel réel)"}
        </Button>
      )}
    </div>
  );
}
