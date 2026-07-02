import { NavLink } from "react-router-dom";
import { useCurrentUser } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

export function Sidebar() {
  const user = useCurrentUser();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="rounded-md bg-white p-1 ring-1 ring-white/10">
          <img src="/dga-icon-512.png" alt="" className="h-9 w-9" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-semibold tracking-tight text-white">DGA</p>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-sidebar-foreground/80">
            Gestion Académique
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5" aria-label="Navigation principale">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-brand transition-all",
                    isActive ? "w-1 opacity-100" : "w-0 opacity-0",
                  )}
                />
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-brand" : "text-sidebar-foreground/70 group-hover:text-white",
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs">
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-sidebar-foreground/60">
          Connecté en tant que
        </p>
        <span className="font-medium text-white">{ROLE_LABELS[user.role]}</span>
      </div>
    </aside>
  );
}
