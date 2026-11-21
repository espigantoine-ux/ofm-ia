"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AppointmentActions({ appointmentId, firstProposedSlot }: { appointmentId: string; firstProposedSlot: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.from("appointments").update({ status: "confirmee", confirmed_slot: firstProposedSlot }).eq("id", appointmentId);
    setBusy(false);
    router.refresh();
  }

  async function cancel() {
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.from("appointments").update({ status: "annulee" }).eq("id", appointmentId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" disabled={busy} onClick={confirm}>
        Confirmer
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={cancel}>
        Annuler
      </Button>
    </div>
  );
}
