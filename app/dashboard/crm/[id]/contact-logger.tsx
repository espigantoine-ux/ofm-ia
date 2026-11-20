"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Platform } from "@/lib/types/database";

// Journalise un envoi déjà fait manuellement par l'humain sur la
// plateforme — n'envoie jamais rien lui-même. Crée la conversation si elle
// n'existe pas encore.
export function ContactLogger({
  creatorId,
  platform,
  conversationId,
}: {
  creatorId: string;
  platform: Platform;
  conversationId: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({ creator_id: creatorId, platform, status: "active" })
        .select("id")
        .single();
      if (convError || !conv) {
        setSaving(false);
        setError("Impossible de créer la conversation.");
        return;
      }
      convId = conv.id;
    }

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: convId,
      platform,
      sender: "agent",
      content,
      status: "sent",
      created_by: user?.id ?? null,
      sent_at: new Date().toISOString(),
    });
    await supabase.from("creators").update({ last_contact_at: new Date().toISOString(), status: "contacte" }).eq("id", creatorId);
    setSaving(false);
    if (messageError) {
      setError("Impossible d'enregistrer le message.");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        Tu as déjà envoyé ce message toi-même sur {platform} ? Journalise-le ici — l&apos;app n&apos;envoie rien à ta place.
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Contenu du message envoyé..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" type="submit" className="w-fit" disabled={saving}>
        {saving ? "Enregistrement..." : "Marquer comme envoyé"}
      </Button>
    </form>
  );
}
