import * as React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/features/personnel/role-badge";
import { formatRelativeTime } from "@/lib/utils";
import { useOnlinePresence } from "./api";
import { LiveDot, OnlineAvatar, onlineUserName, sortByRecentActivity } from "./presence-ui";

const PREVIEW_COUNT = 5;

/**
 * Rail du tableau de bord (DIRECTION/ADMIN) : les connectés du moment.
 * Le détail complet reste dans l'indicateur de l'en-tête.
 */
export function OnlineNowCard() {
  const query = useOnlinePresence();
  const data = query.data;

  const users = React.useMemo(() => sortByRecentActivity(data?.utilisateurs ?? []), [data]);
  const preview = users.slice(0, PREVIEW_COUNT);
  const rest = users.length - preview.length;

  if (query.isError) return null;

  return (
    <Card className="animate-rise-in" style={{ animationDelay: "320ms" }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LiveDot /> En ligne maintenant
        </CardTitle>
        <CardDescription>
          {query.isPending
            ? "Chargement…"
            : users.length === 0
              ? "Personne n'est connecté pour l'instant."
              : `${data?.total ?? users.length} connecté${(data?.total ?? users.length) > 1 ? "s" : ""} sur les ${data?.fenetre_minutes ?? 0} dernières minutes.`}
        </CardDescription>
      </CardHeader>
      {preview.length > 0 ? (
        <div className="px-6 pb-5">
          <ul className="divide-y">
            {preview.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-2.5">
                <OnlineAvatar user={user} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{onlineUserName(user)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatRelativeTime(user.derniere_activite ?? user.derniere_connexion)}
                  </span>
                </span>
                <RoleBadge role={user.role} />
              </li>
            ))}
          </ul>
          {rest > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              et {rest} autre{rest > 1 ? "s" : ""} — voir l'indicateur « en ligne » en haut à droite.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
