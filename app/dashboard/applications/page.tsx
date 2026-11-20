import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PLATFORM_LABELS } from "@/lib/creator-status";
import type { Creator, CreatorStatus, Platform } from "@/lib/types/database";

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("creators")
    .select("*")
    .eq("source", "inbound")
    .order("created_at", { ascending: false })
    .limit(100);
  const creators = (data ?? []) as Creator[];

  return (
    <>
      <Topbar title="Candidatures" description="Candidatures reçues via le formulaire public /apply" />
      <main className="flex flex-col gap-2 p-6">
        {creators.length === 0 && <p className="text-sm text-muted-foreground">Aucune candidature pour l&apos;instant.</p>}
        {creators.map((c) => (
          <Link key={c.id} href={`/dashboard/crm/${c.id}`}>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{PLATFORM_LABELS[c.platform as Platform]}</Badge>
                <div>
                  <p className="text-sm font-medium">{c.display_name || c.handle}</p>
                  <p className="text-xs text-muted-foreground">{c.contact_email}</p>
                </div>
              </div>
              <Badge variant={STATUS_BADGE_VARIANT[c.status as CreatorStatus]}>{STATUS_LABELS[c.status as CreatorStatus]}</Badge>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}
