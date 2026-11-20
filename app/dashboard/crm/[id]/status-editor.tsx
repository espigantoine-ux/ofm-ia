"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/creator-status";
import type { CreatorStatus } from "@/lib/types/database";

export function StatusEditor({ creatorId, initialStatus }: { creatorId: string; initialStatus: CreatorStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<CreatorStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: CreatorStatus) {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("creators").update({ status: next }).eq("id", creatorId);
    setSaving(false);
    if (!error) {
      setStatus(next);
      router.refresh();
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as CreatorStatus)}
      className="h-9 rounded-md border border-border bg-card px-2 text-sm outline-none focus:border-primary disabled:opacity-60"
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
