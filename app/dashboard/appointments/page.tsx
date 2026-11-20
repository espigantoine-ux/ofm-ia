import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { NewAppointmentForm } from "./new-appointment-form";
import type { Appointment, Creator } from "@/lib/types/database";

export default async function AppointmentsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("*, creator:creators(id, handle, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const appointments = (appointmentsData ?? []) as (Appointment & { creator: Creator | null })[];

  const { data: creatorsData } = await supabase
    .from("creators")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const creators = (creatorsData ?? []) as Creator[];

  const upcoming = appointments.filter((a) => a.status !== "annulee");

  return (
    <>
      <Topbar title="Rendez-vous" description="Créneaux proposés et confirmés" />
      <main className="flex flex-col gap-5 p-6">
        <NewAppointmentForm creators={creators} />

        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Aucun rendez-vous pour l&apos;instant.</p>}
          {upcoming.map((a) => (
            <Link key={a.id} href={a.creator ? `/dashboard/crm/${a.creator.id}` : "#"}>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
                <div>
                  <p className="text-sm font-medium">{a.creator?.display_name || a.creator?.handle || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.confirmed_slot
                      ? new Date(a.confirmed_slot).toLocaleString("fr-FR")
                      : a.proposed_slots.map((s) => new Date(s).toLocaleString("fr-FR")).join(", ")}
                  </p>
                </div>
                <Badge variant={a.status === "confirmee" ? "default" : "secondary"}>
                  {a.status === "confirmee" ? "Confirmé" : "Proposé"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
