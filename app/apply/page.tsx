"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/types/database";

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X / Twitter" },
  { value: "autre", label: "Autre" },
];

export default function ApplyPage() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          handle,
          displayName: displayName || undefined,
          profileUrl: profileUrl || undefined,
          contactEmail,
          motivation: motivation || undefined,
          availability: availability || undefined,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Candidature envoyée</p>
        <p className="text-sm text-muted-foreground">
          On revient vers toi par email à {contactEmail} dès que ta candidature a été étudiée.
        </p>
        <Link href="/" className="text-sm text-primary underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <Link href="/" className="text-lg font-bold tracking-tight">
          OFM<span className="text-primary"> AI</span>
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Candidater</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quelques infos pour qu&apos;on revienne vers toi.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        >
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Ton identifiant / pseudo"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <input
          placeholder="Ton nom (optionnel)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <input
          placeholder="URL de ton profil (optionnel)"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <input
          required
          type="email"
          placeholder="Ton email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <textarea
          placeholder="Pourquoi tu candidates (optionnel)"
          rows={3}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          placeholder="Disponibilité (optionnel)"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer ma candidature"}
        </Button>
      </form>
    </div>
  );
}
