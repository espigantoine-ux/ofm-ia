"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Platform } from "@/lib/types/database";
import { MessageCircle } from "lucide-react";

export function OpenConversationButton({
  creatorId,
  platform,
  existingConversationId,
}: {
  creatorId: string;
  platform: Platform;
  existingConversationId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (existingConversationId) {
      router.push(`/dashboard/conversations/${existingConversationId}`);
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("conversations")
      .insert({ creator_id: creatorId, platform, status: "active" })
      .select("id")
      .single();
    setLoading(false);
    if (data) router.push(`/dashboard/conversations/${data.id}`);
  }

  return (
    <Button size="sm" className="gap-1.5" disabled={loading} onClick={handleClick}>
      <MessageCircle className="h-3.5 w-3.5" />
      {loading ? "Ouverture..." : "Ouvrir la conversation"}
    </Button>
  );
}
