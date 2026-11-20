import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PLATFORM_LABELS } from "@/lib/creator-status";
import type { Creator, CreatorStatus, Message, Conversation, Appointment, Platform } from "@/lib/types/database";

const VALID_PLATFORMS = ["instagram", "tiktok", "x", "autre"];

const TABS = [
  { key: "contacts", label: "Tous les contacts" },
  { key: "sent", label: "Messages envoyés" },
  { key: "received", label: "Messages reçus" },
  { key: "pending", label: "Messages à traiter" },
  { key: "conv_done", label: "Conversations traitées" },
  { key: "conv_waiting", label: "Conversations en attente" },
  { key: "appointments", label: "Rendez-vous" },
];

export default async function PlatformPage({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { platform } = await params;
  const { tab = "contacts" } = await searchParams;
  if (!VALID_PLATFORMS.includes(platform)) notFound();
  const p = platform as Platform;

  const supabase = await createServerSupabaseClient();
  const { data: configData } = await supabase.from("platform_configs").select("*").eq("platform", p).maybeSingle();

  return (
    <>
      <Topbar title={PLATFORM_LABELS[p]} description={configData?.notes ?? undefined} />
      <main className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/platforms/${platform}?tab=${t.key}`}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.key ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "contacts" && <ContactsTab platform={p} />}
        {tab === "sent" && <MessagesTab platform={p} filter={{ status: "sent" }} />}
        {tab === "received" && <MessagesTab platform={p} filter={{ sender: "creator" }} />}
        {tab === "pending" && <MessagesTab platform={p} filter={{ status: "pending_review" }} />}
        {tab === "conv_done" && <ConversationsTab platform={p} status="archived" />}
        {tab === "conv_waiting" && <ConversationsTab platform={p} status="active" />}
        {tab === "appointments" && <AppointmentsTab platform={p} />}
      </main>
    </>
  );
}

async function ContactsTab({ platform }: { platform: Platform }) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("creators")
    .select("*")
    .eq("platform", platform)
    .order("created_at", { ascending: false })
    .limit(100);
  const creators = (data ?? []) as Creator[];

  if (creators.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      {creators.map((c) => (
        <Link key={c.id} href={`/dashboard/crm/${c.id}`}>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
            <div>
              <p className="text-sm font-medium">{c.display_name || c.handle}</p>
              <p className="text-xs text-muted-foreground">@{c.handle}</p>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[c.status as CreatorStatus]}>{STATUS_LABELS[c.status as CreatorStatus]}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function MessagesTab({
  platform,
  filter,
}: {
  platform: Platform;
  filter: { status?: string; sender?: string };
}) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("messages")
    .select("*, conversation:conversations(creator:creators(id, handle, display_name))")
    .eq("platform", platform)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.sender) query = query.eq("sender", filter.sender);
  const { data } = await query;
  const messages = (data ?? []) as (Message & { conversation: { creator: Creator } | null })[];

  if (messages.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <Link key={m.id} href={m.conversation?.creator ? `/dashboard/crm/${m.conversation.creator.id}` : "#"}>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{m.conversation?.creator?.display_name || m.conversation?.creator?.handle || "—"}</p>
              <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")}</span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{m.content}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function ConversationsTab({ platform, status }: { platform: Platform; status: string }) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("conversations")
    .select("*, creator:creators(id, handle, display_name)")
    .eq("platform", platform)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  const conversations = (data ?? []) as (Conversation & { creator: Creator | null })[];

  if (conversations.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      {conversations.map((c) => (
        <Link key={c.id} href={c.creator ? `/dashboard/crm/${c.creator.id}` : "#"}>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
            <p className="text-sm font-medium">{c.creator?.display_name || c.creator?.handle || "—"}</p>
            <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function AppointmentsTab({ platform }: { platform: Platform }) {
  const supabase = await createServerSupabaseClient();
  const { data: creatorsData } = await supabase.from("creators").select("id").eq("platform", platform);
  const ids = (creatorsData ?? []).map((c) => c.id);
  if (ids.length === 0) return <Empty />;

  const { data } = await supabase
    .from("appointments")
    .select("*, creator:creators(id, handle, display_name)")
    .in("creator_id", ids)
    .order("created_at", { ascending: false });
  const appointments = (data ?? []) as (Appointment & { creator: Creator | null })[];

  if (appointments.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      {appointments.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">{a.creator?.display_name || a.creator?.handle || "—"}</p>
          <Badge variant={a.status === "confirmee" ? "default" : a.status === "annulee" ? "destructive" : "secondary"}>
            {a.status === "confirmee" ? "Confirmé" : a.status === "annulee" ? "Annulé" : "Proposé"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Aucun résultat pour cette catégorie.</p>;
}
