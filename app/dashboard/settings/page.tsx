import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { AiPauseToggle } from "./ai-pause-toggle";
import type { StaffProfile } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase.from("staff_profiles").select("*").eq("id", user!.id).single();
  const profile = profileData as StaffProfile;

  const { data: settingsData } = await supabase.from("app_settings").select("ai_paused").eq("id", true).single();

  return (
    <>
      <Topbar title="Paramètres" description="Réglages globaux de l'équipe" />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 p-6">
        <AiPauseToggle initialPaused={settingsData?.ai_paused ?? false} isAdmin={profile.is_admin} />
      </main>
    </>
  );
}
