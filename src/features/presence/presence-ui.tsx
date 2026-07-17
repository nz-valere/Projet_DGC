import type { OnlineUser } from "@/api/types";
import { cn } from "@/lib/utils";

/** Point vert « respirant » : cœur plein + halo qui pulse. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/** Nom affichable d'un connecté ; repli sur l'identifiant de l'e-mail. */
export function onlineUserName(user: OnlineUser): string {
  const full = [user.prenom, user.nom].filter(Boolean).join(" ").trim();
  return full || user.email.split("@")[0] || user.email;
}

export function onlineUserInitials(user: OnlineUser): string {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.trim();
  return (initials || user.email.slice(0, 2)).toUpperCase();
}

/** Pastille d'identité avec le témoin « connecté » ancré en bas à droite. */
export function OnlineAvatar({
  user,
  ringClassName = "border-card",
}: {
  user: OnlineUser;
  /** Couleur du liseré du témoin : doit matcher le fond du conteneur. */
  ringClassName?: string;
}) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
      {onlineUserInitials(user)}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-500",
          ringClassName,
        )}
      />
    </span>
  );
}

/** Connectés triés par activité la plus récente. */
export function sortByRecentActivity(users: readonly OnlineUser[]): OnlineUser[] {
  return [...users].sort((a, b) => {
    const ta = new Date(a.derniere_activite ?? a.derniere_connexion ?? 0).getTime();
    const tb = new Date(b.derniere_activite ?? b.derniere_connexion ?? 0).getTime();
    return tb - ta;
  });
}
