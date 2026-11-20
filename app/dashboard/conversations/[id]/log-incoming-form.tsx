"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Platform } from "@/lib/types/database";

// Pas d'intégration de messagerie live sur aucune plateforme (voir
// platform_configs.notes) — tout message, dans les deux sens, est
// journalisé manuellement par l'humain qui l'a vu/envoyé sur la
// plateforme elle-même.
export function LogIncomingForm({ conversationId, platform }: { conversationId: string; platform: Platform }) {
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
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      platform,
      sender: "creator",
      content,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    setSaving(false);
    if (insertError) {
      setError("Impossible d'enregistrer le message.");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">Le créateur a répondu sur {platform} ? Journalise sa réponse ici.</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Réponse reçue..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" type="submit" variant="outline" className="w-fit" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer la réponse reçue"}
      </Button>
    </form>
  );
}
