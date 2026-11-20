"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Creator } from "@/lib/types/database";

export function NewAppointmentForm({ creators }: { creators: Creator[] }) {
  const router = useRouter();
  const [creatorId, setCreatorId] = useState(creators[0]?.id ?? "");
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creatorId || !slot) return;
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("appointments").insert({
      creator_id: creatorId,
      proposed_slots: [new Date(slot).toISOString()],
      status: "proposee",
    });
    setSaving(false);
    if (insertError) {
      setError("Impossible de créer le rendez-vous.");
      return;
    }
    setSlot("");
    router.refresh();
  }

  if (creators.length === 0) {
    return <p className="text-sm text-muted-foreground">Ajoute d&apos;abord un créateur dans le CRM pour lui proposer un rendez-vous.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Créateur</label>
        <select
          value={creatorId}
          onChange={(e) => setCreatorId(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name || c.handle}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Créneau proposé</label>
        <input
          type="datetime-local"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Création..." : "Proposer le rendez-vous"}
      </Button>
    </form>
  );
}
