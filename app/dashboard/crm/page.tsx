import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, STATUS_ORDER, PLATFORM_LABELS } from "@/lib/creator-status";
import type { Creator, CreatorStatus, Platform } from "@/lib/types/database";
import { Plus } from "lucide-react";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; status?: string; q?: string }>;
}) {
  const { platform, status, q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase.from("creators").select("*").order("created_at", { ascending: false });
  if (platform) query = query.eq("platform", platform);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);

  const { data } = await query.limit(100);
  const creators = (data ?? []) as Creator[];

  return (
    <>
      <Topbar title="CRM" description="Toutes les candidatures et tous les prospects" />
      <main className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex flex-wrap items-center gap-2" method="get">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un nom ou un pseudo..."
              className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
            <select name="platform" defaultValue={platform ?? ""} className="h-9 rounded-md border border-border bg-card px-2 text-sm">
              <option value="">Toutes plateformes</option>
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border border-border bg-card px-2 text-sm">
              <option value="">Tous statuts</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              Filtrer
            </Button>
          </form>
          <Link href="/dashboard/crm/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter un prospect
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {creators.length === 0 && <p className="text-sm text-muted-foreground">Aucun résultat.</p>}
          {creators.map((c) => (
            <Link key={c.id} href={`/dashboard/crm/${c.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{PLATFORM_LABELS[c.platform as Platform]}</Badge>
                  <div>
                    <p className="text-sm font-medium">{c.display_name || c.handle}</p>
                    <p className="text-xs text-muted-foreground">@{c.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {c.source === "inbound" ? "Candidature" : "Prospection"}
                  </Badge>
                  <Badge variant={STATUS_BADGE_VARIANT[c.status as CreatorStatus]}>{STATUS_LABELS[c.status as CreatorStatus]}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
