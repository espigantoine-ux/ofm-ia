import { HelpCircle } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Topbar({
  title,
  description,
  userEmail,
  action,
}: {
  title: string;
  description?: string;
  userEmail?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <div>
        <h1 className="text-base font-semibold leading-none">{title}</h1>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <NotificationBell />
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Aide">
          <HelpCircle className="h-4 w-4" />
        </button>
        {userEmail && <span className="hidden text-xs text-muted-foreground sm:inline">{userEmail}</span>}
      </div>
    </header>
  );
}
