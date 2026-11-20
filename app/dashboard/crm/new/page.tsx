"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Platform } from "@/lib/types/database";
import { PLATFORM_LABELS } from "@/lib/creator-status";

// Ajout manuel d'un prospect repéré par l'équipe sur une plateforme —
// aucun scraping ni appel automatisé, c'est un humain qui saisit ce qu'il
// a vu en parcourant la plateforme lui-même.
export default function NewProspectPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error: insertError } = await supabase
      .from("creators")
      .insert({
        platform,
        source: "outreach",
        handle,
        display_name: displayName || null,
        profile_url: profileUrl || null,
        notes: notes || null,
        status: "nouveau",
        added_by: user?.id ?? null,
      })
      .select()
      .single();
    setSubmitting(false);
    if (insertError || !data) {
      setError("Impossible d'enregistrer ce prospect.");
      return;
    }
    router.push(`/dashboard/crm/${data.id}`);
  }

  return (
    <>
      <Topbar title="Ajouter un prospect" description="Profil repéré manuellement sur une plateforme" />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Identifiant / pseudo"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="Nom affiché (optionnel)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <input
            placeholder="URL du profil"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <textarea
            placeholder="Notes (pourquoi ce profil t'intéresse...)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Enregistrer le prospect"}
          </Button>
        </form>
      </main>
    </>
  );
}
