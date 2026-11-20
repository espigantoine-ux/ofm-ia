"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AiPauseToggle({ initialPaused, isAdmin }: { initialPaused: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [paused, setPaused] = useState(initialPaused);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.from("app_settings").update({ ai_paused: !paused }).eq("id", true);
    setSaving(false);
    if (updateError) {
      setError("Impossible de changer le réglage — réservé aux admins.");
      return;
    }
    setPaused(!paused);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Pause globale de la génération IA</p>
          <p className="text-xs text-muted-foreground">
            Coupe immédiatement la génération de nouvelles propositions IA pour toute l&apos;équipe. N&apos;affecte pas
            les messages déjà validés ni la journalisation manuelle.
          </p>
        </div>
        <Button size="sm" variant={paused ? "destructive" : "outline"} disabled={saving || !isAdmin} onClick={toggle}>
          {paused ? "En pause — réactiver" : "Mettre en pause"}
        </Button>
      </div>
      {!isAdmin && <p className="text-xs text-muted-foreground">Réservé aux comptes admin.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
