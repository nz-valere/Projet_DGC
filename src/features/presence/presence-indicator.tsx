import { GraduationCap, Users } from "lucide-react";
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentUser } from "@/features/auth/auth-context";
import { RoleBadge } from "@/features/personnel/role-badge";
import { formatRelativeTime } from "@/lib/utils";
import { useEtudiantsEnLigne, useOnlinePresence } from "./api";
import { LiveDot, OnlineAvatar, onlineUserName, sortByRecentActivity } from "./presence-ui";

/** Panneau nominatif (DIRECTION/ADMIN) : qui est connecté, trié par activité récente. */
function OnlinePanel() {
  const query = useOnlinePresence();
  const data = query.data;

  const users = React.useMemo(
    () => sortByRecentActivity(data?.utilisateurs ?? []),
    [data],
  );

  const etudiants = React.useMemo(
    () => users.filter((user) => user.role === "ETUDIANT").length,
    [users],
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
            <LiveDot /> En ligne maintenant
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data ? `Fenêtre de ${data.fenetre_minutes} min` : "Chargement…"}
            {data && etudiants > 0 ? ` · ${etudiants} étudiant${etudiants > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-accent px-2 font-display text-lg font-semibold tabular-nums text-accent-foreground">
          {data?.total ?? "—"}
        </span>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto border-t px-1.5 py-1.5">
        {query.isPending ? (
          <ul className="space-y-1 px-2 py-1.5" aria-busy="true">
            {[0, 1, 2].map((index) => (
              <li key={index} className="flex items-center gap-3 py-1.5">
                <span className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <span className="flex-1 space-y-1.5">
                  <span className="block h-2.5 w-24 animate-pulse rounded bg-muted" />
                  <span className="block h-2 w-16 animate-pulse rounded bg-muted" />
                </span>
              </li>
            ))}
          </ul>
        ) : users.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Personne n'est connecté pour l'instant.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent/50"
              >
                <OnlineAvatar user={user} ringClassName="border-popover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{onlineUserName(user)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <RoleBadge role={user.role} />
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {formatRelativeTime(user.derniere_activite ?? user.derniere_connexion)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Vue étudiant / personnel non habilité : compteur d'étudiants, sans identités. */
function StudentCountPill() {
  const query = useEtudiantsEnLigne();
  const data = query.data;
  if (!data) return null;

  const plural = data.etudiants_en_ligne > 1 ? "s" : "";
  return (
    <div
      className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex"
      title={`${data.etudiants_en_ligne} étudiant${plural} connecté${plural} (fenêtre de ${data.fenetre_minutes} min)`}
    >
      <LiveDot />
      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums text-foreground">{data.etudiants_en_ligne}</span>
      <span className="hidden md:inline">en ligne</span>
    </div>
  );
}

/** Bouton + panneau nominatif pour DIRECTION/ADMIN. */
function OnlinePresenceButton() {
  const query = useOnlinePresence();
  const total = query.data?.total;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Présence : ${total ?? 0} personne${(total ?? 0) > 1 ? "s" : ""} en ligne`}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card transition-all hover:border-brand/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-brand/50 data-[state=open]:text-foreground"
        >
          <LiveDot />
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums text-foreground">{total ?? "—"}</span>
          <span className="hidden md:inline">en ligne</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <OnlinePanel />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Indicateur de présence temps réel de l'en-tête.
 * DIRECTION/ADMIN obtiennent la liste nominative ; les autres rôles, le simple
 * compteur d'étudiants en ligne — c'est l'accès accordé par le backend.
 */
export function PresenceIndicator() {
  const user = useCurrentUser();
  const canSeeOnline = user.role === "DIRECTION" || user.role === "ADMIN";
  return canSeeOnline ? <OnlinePresenceButton /> : <StudentCountPill />;
}
