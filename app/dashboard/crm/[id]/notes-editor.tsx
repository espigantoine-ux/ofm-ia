"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function NotesEditor({ creatorId, initialNotes }: { creatorId: string; initialNotes: string | null }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("creators").update({ notes }).eq("id", creatorId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Notes internes..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={saving} onClick={handleSave}>
          {saving ? "Enregistrement..." : "Enregistrer les notes"}
        </Button>
        {saved && <span className="text-xs text-success">Enregistré</span>}
      </div>
    </div>
  );
}
