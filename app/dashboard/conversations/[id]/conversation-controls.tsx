"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ConversationStatus } from "@/lib/types/database";
import { Pause, Play, Archive } from "lucide-react";

export function ConversationControls({ conversationId, status }: { conversationId: string; status: ConversationStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: ConversationStatus) {
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.from("conversations").update({ status: next }).eq("id", conversationId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {status === "active" && (
        <Button size="sm" variant="outline" disabled={busy} className="gap-1.5" onClick={() => setStatus("paused")}>
          <Pause className="h-3.5 w-3.5" /> Mettre en pause
        </Button>
      )}
      {status === "paused" && (
        <Button size="sm" variant="outline" disabled={busy} className="gap-1.5" onClick={() => setStatus("active")}>
          <Play className="h-3.5 w-3.5" /> Reprendre
        </Button>
      )}
      {status !== "archived" && (
        <Button size="sm" variant="ghost" disabled={busy} className="gap-1.5" onClick={() => setStatus("archived")}>
          <Archive className="h-3.5 w-3.5" /> Archiver
        </Button>
      )}
    </div>
  );
}
