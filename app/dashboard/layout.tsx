import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-svh overflow-hidden">
      <Suspense fallback={<div className="hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex" />}>
        <Sidebar userEmail={user?.email} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
