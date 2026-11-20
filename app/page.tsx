import Link from "next/link";
import { ArrowRight, Users, MessageCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-info text-xs font-bold text-primary-foreground">
              OF
            </span>
            OFM<span className="text-primary"> AI</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Connexion
            </Link>
            <Link href="/apply">
              <Button variant="outline" className="rounded-full">
                Candidater
              </Button>
            </Link>
            <Link href="/signup">
              <Button>Accès équipe</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.12), transparent 70%)" }}
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
          <h1 className="text-4xl tracking-tight sm:text-6xl">
            Le CRM qui <span className="text-primary">centralise</span> tes candidatures et ta prospection.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Candidatures entrantes qualifiées par IA, prospection externe organisée, un seul pipeline pour toute
            l&apos;équipe.
          </p>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Accès équipe <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">
                Candidater
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-3">
          <FeatureCard icon={Users} title="CRM unifié" description="Candidatures et prospects dans un seul pipeline, par statut et par plateforme." />
          <FeatureCard icon={MessageCircle} title="IA de rédaction" description="L'IA qualifie et propose des réponses, l'équipe garde le contrôle avant tout envoi." />
          <FeatureCard icon={CalendarClock} title="Rendez-vous" description="Créneaux, confirmation et historique centralisés." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="glow-border-hover card-hover flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
