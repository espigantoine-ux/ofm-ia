"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const redirect = searchParams.get("redirect") ?? "/dashboard";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Vérifie ta boîte mail</p>
        <p className="text-sm text-muted-foreground">
          On a envoyé un lien de confirmation à {email}. Clique dessus pour activer ton compte.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        OFM<span className="text-primary"> AI</span>
      </Link>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-primary underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
