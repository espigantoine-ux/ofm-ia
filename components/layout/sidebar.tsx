"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Instagram, Music2, Twitter, Globe, Users, CalendarClock, FileText } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/platforms/instagram", label: "Instagram", icon: Instagram },
  { href: "/dashboard/platforms/tiktok", label: "TikTok", icon: Music2 },
  { href: "/dashboard/platforms/x", label: "X / Twitter", icon: Twitter },
  { href: "/dashboard/platforms/autre", label: "Autres canaux", icon: Globe },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/appointments", label: "Rendez-vous", icon: CalendarClock },
  { href: "/dashboard/applications", label: "Candidatures", icon: FileText },
];

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-info text-xs font-bold text-primary-foreground">
          OF
        </span>
        <span className="text-[15px] font-semibold tracking-tight">OFM AI</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                active
                  ? "bg-gradient-to-r from-primary/15 to-transparent text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              {active ? (
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <span className="absolute inset-0 -z-10 rounded-md bg-primary/25 blur-sm" />
                  <Icon className="h-4 w-4" />
                </span>
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            <span className="absolute inset-0 -z-10 rounded-full bg-primary/15 blur-sm" />
            {(userEmail ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userEmail ?? "Mon compte"}</p>
            <p className="text-xs text-muted-foreground">Voir le compte</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
