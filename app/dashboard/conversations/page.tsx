import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS } from "@/lib/creator-status";
import type { Conversation, Creator, Message, Platform } from "@/lib/types/database";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; q?: string; status?: string }>;
}) {
  const { platform, q, status } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("conversations")
    .select("*, creator:creators(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (platform) query = query.eq("platform", platform);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "archived");

  const { data } = await query;
  let conversations = (data ?? []) as (Conversation & { creator: Creator })[];

  if (q) {
    const needle = q.toLowerCase();
    conversations = conversations.filter(
      (c) => c.creator?.handle?.toLowerCase().includes(needle) || c.creator?.display_name?.toLowerCase().includes(needle)
    );
  }

  // Dernier message de chaque conversation, pour l'aperçu — en une seule
  // requête plutôt qu'un aller-retour par conversation.
  const conversationIds = conversations.map((c) => c.id);
  const latestByConversation = new Map<string, Message>();
  if (conversationIds.length > 0) {
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });
    for (const m of (lastMessages ?? []) as Message[]) {
      if (!latestByConversation.has(m.conversation_id)) latestByConversation.set(m.conversation_id, m);
    }
  }

  return (
    <>
      <Topbar title="Centre de conversation" description="Vue en direct de tous les échanges" />
      <main className="flex flex-col gap-5 p-6">
        <form className="flex flex-wrap items-center gap-2" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom..."
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
            <option value="">Actives + en pause</option>
            <option value="active">Actives</option>
            <option value="paused">En pause</option>
            <option value="archived">Archivées</option>
          </select>
          <button type="submit" className="h-9 rounded-md border border-border px-3 text-sm hover:bg-muted">
            Filtrer
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {conversations.length === 0 && <p className="text-sm text-muted-foreground">Aucune conversation.</p>}
          {conversations.map((c) => {
            const last = latestByConversation.get(c.id);
            return (
              <Link key={c.id} href={`/dashboard/conversations/${c.id}`}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge variant="outline" className="shrink-0">
                      {PLATFORM_LABELS[c.platform as Platform]}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.creator?.display_name || c.creator?.handle}</p>
                      {last && <p className="truncate text-xs text-muted-foreground">{last.content}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {last?.status === "pending_review" && <Badge>À valider</Badge>}
                    {last?.status === "approved" && <Badge variant="secondary">À envoyer</Badge>}
                    <Badge variant="outline" className="capitalize">
                      {c.status === "active" ? "Active" : c.status === "paused" ? "En pause" : "Archivée"}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
