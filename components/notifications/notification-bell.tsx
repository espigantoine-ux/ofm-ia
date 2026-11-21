"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { NOTIFICATION_LABELS, notificationLink } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types/database";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let userId: string | null = null;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const [{ data: list }, { count }] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
      ]);
      setNotifications((list ?? []) as AppNotification[]);
      setUnreadCount(count ?? 0);
    }

    load();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as AppNotification;
          if (row.recipient_id !== userId) return;
          setNotifications((prev) => [row, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleOpenNotification(n: AppNotification) {
    setOpen(false);
    if (!n.read_at) {
      const supabase = createBrowserSupabaseClient();
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    router.push(notificationLink(n.type, n.payload));
  }

  async function handleMarkAllRead() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 flex w-80 flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="flex max-h-96 flex-col gap-0.5 overflow-y-auto">
            {notifications.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Rien pour l&apos;instant.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={`flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  !n.read_at ? "bg-primary/5" : ""
                }`}
              >
                <span className="font-medium">{NOTIFICATION_LABELS[n.type]}</span>
                {typeof n.payload.preview === "string" && (
                  <span className="truncate text-xs text-muted-foreground">{n.payload.preview}</span>
                )}
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("fr-FR")}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
