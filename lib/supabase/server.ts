import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client scopé à la session de l'utilisateur courant (RLS appliquée selon
// son JWT) — à utiliser dans les Server Components et Route Handlers pour
// toute lecture/écriture qui doit respecter les policies "staff".
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component (pas une Server Action/Route
          // Handler) : l'écriture de cookie échoue silencieusement, le
          // proxy se charge du refresh de session dans ce cas.
        }
      },
    },
  });
}
