import { createClient } from "@supabase/supabase-js";

// Client service_role — bypasse RLS. Réservé à l'insertion de candidatures
// depuis le formulaire public /apply (non authentifié, voir migration
// 0001 — "creators" n'a aucune policy INSERT pour "anon") et aux écritures
// système (IA, webhooks). Jamais exposé côté client.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
