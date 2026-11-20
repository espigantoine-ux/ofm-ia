import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  platform: z.enum(["instagram", "tiktok", "x", "autre"]),
  handle: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  profileUrl: z.string().url().max(500).optional(),
  contactEmail: z.string().email().max(200),
  motivation: z.string().max(2000).optional(),
  availability: z.string().max(500).optional(),
  // Honeypot anti-spam : un bot de formulaire remplit généralement tous les
  // champs, y compris ceux cachés visuellement. Un humain ne le voit jamais.
  website: z.string().max(0).optional(),
});

// Seul point d'entrée non authentifié qui écrit dans `creators` — passe
// obligatoirement par le client admin car la table n'a aucune policy
// INSERT pour "anon" (voir migration 0001). Le navigateur ne peut jamais
// écrire de candidature directement en base.
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) {
    // Honeypot déclenché — on répond succès pour ne pas indiquer au bot
    // que son remplissage a été détecté, mais on n'écrit rien.
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("creators").insert({
    platform: d.platform,
    source: "inbound",
    handle: d.handle,
    display_name: d.displayName ?? null,
    profile_url: d.profileUrl ?? null,
    contact_email: d.contactEmail,
    status: "nouveau",
    application_answers: { motivation: d.motivation ?? null, availability: d.availability ?? null },
  });

  if (error) {
    return NextResponse.json({ error: "Impossible d'enregistrer ta candidature." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
