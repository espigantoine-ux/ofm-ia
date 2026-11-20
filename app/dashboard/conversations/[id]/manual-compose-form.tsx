"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Platform } from "@/lib/types/database";

export function ManualComposeForm({ conversationId, platform }: { conversationId: string; platform: Platform }) {
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
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      platform,
      sender: "agent",
      content,
      status: "approved",
      created_by: user?.id ?? null,
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
      <p className="text-xs text-muted-foreground">
        Rédiger sans passer par l&apos;IA — le message sera prêt à envoyer manuellement, comme une proposition validée.
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ton message..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" type="submit" className="w-fit" disabled={saving}>
        {saving ? "Enregistrement..." : "Ajouter comme message prêt à envoyer"}
      </Button>
    </form>
  );
}
