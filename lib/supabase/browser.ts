import { createBrowserClient } from "@supabase/ssr";

// Client côté navigateur — utilisé dans les Client Components pour les
// lectures directes (RLS "staff") sans passer par une route API.
export function createBrowserSupabaseClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
