import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
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
import { ROLE_LABELS } from "@/lib/labels";
import { Breadcrumbs } from "./breadcrumbs";

export function Header() {
  const user = useCurrentUser();
  const displayName = useDisplayName();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <Breadcrumbs />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline">{displayName}</span>
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
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
    </header>
  );
}
