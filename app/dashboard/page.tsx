import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGlobalStats, getPlatformStats } from "@/lib/stats";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Mail, Clock, CalendarClock, Handshake, Instagram, Music2, Twitter, Globe } from "lucide-react";
import type { Platform } from "@/lib/types/database";

const PLATFORMS: { slug: Platform; label: string; icon: typeof Instagram }[] = [
  { slug: "instagram", label: "Instagram", icon: Instagram },
  { slug: "tiktok", label: "TikTok", icon: Music2 },
  { slug: "x", label: "X / Twitter", icon: Twitter },
  { slug: "autre", label: "Autres canaux", icon: Globe },
];

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [global, ...platformStats] = await Promise.all([
    getGlobalStats(supabase),
    ...PLATFORMS.map((p) => getPlatformStats(supabase, p.slug)),
  ]);

  const statCards = [
    { label: "Prospects", value: global.totalProspects, icon: Users },
    { label: "Conversations", value: global.totalConversations, icon: MessageSquare },
    { label: "Nouveaux messages", value: global.nouveauxMessages, icon: Mail },
    { label: "Réponses en attente", value: global.reponsesEnAttente, icon: Clock },
    { label: "Rendez-vous", value: global.rendezVous, icon: CalendarClock },
    { label: "Collaborations", value: global.collaborations, icon: Handshake },
  ];

  return (
    <>
      <Topbar title="Dashboard" description="Vue d'ensemble" userEmail={user?.email} />
      <main className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col gap-2 py-4">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary">
                  <span className="absolute inset-0 -z-10 rounded-lg bg-primary/25 blur-md" />
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="text-2xl font-semibold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLATFORMS.map((platform, i) => {
            const stats = platformStats[i];
            const Icon = platform.icon;
            return (
              <Link key={platform.slug} href={`/dashboard/platforms/${platform.slug}`}>
                <Card className="card-hover glow-border-hover h-full">
                  <CardContent className="flex flex-col gap-4 py-5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                        <span className="absolute inset-0 -z-10 rounded-lg bg-primary/25 blur-md" />
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold">{platform.label}</p>
                      <Badge variant="outline" className="ml-auto">
                        {stats.prospects} prospects
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                      <Stat label="Envoyés" value={stats.messagesEnvoyes} />
                      <Stat label="Reçus" value={stats.reponsesRecues} />
                      <Stat label="À traiter" value={stats.messagesATraiter} />
                      <Stat label="Conv. actives" value={stats.conversationsActives} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-base font-semibold text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}
