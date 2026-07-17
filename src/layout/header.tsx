import { ChevronDown, LogOut, Menu, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useCurrentUser } from "@/features/auth/auth-context";
import { useDisplayName } from "@/features/auth/use-display-name";
import { PresenceIndicator } from "@/features/presence/presence-indicator";
import { ROLE_LABELS } from "@/lib/labels";
import { Breadcrumbs } from "./breadcrumbs";

interface HeaderProps {
  /** Ouvre le tiroir de navigation mobile (bouton hamburger, < lg). */
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const user = useCurrentUser();
  const displayName = useDisplayName();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1 h-11 w-11 shrink-0 lg:hidden"
          aria-label="Ouvrir le menu de navigation"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <PresenceIndicator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden sm:inline">{displayName}</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {ROLE_LABELS[user.role]}
              </Badge>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleLogout()}>
              <LogOut /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
