import { Bell, MoreHorizontal, RefreshCw, Search, Send } from "lucide-react";
import * as React from "react";
import type { NotificationResponse } from "@/api/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { EnumBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/auth-context";
import { useUsers } from "@/features/users/api";
import { CANAL_ENVOI, ROLE_LABELS, STATUT_ENVOI } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { useNotifications, useResendNotification } from "./api";
import { NotificationFormDialog } from "./notification-form-dialog";

const ALL = "__all__";

export function NotificationsListPage() {
  const user = useCurrentUser();
  /** Création et renvoi : ADMIN/DIRECTION (lecture ouverte à tout le personnel). */
  const canSend = user.role === "ADMIN" || user.role === "DIRECTION";

  const notificationsQuery = useNotifications();
  const usersQuery = useUsers();
  const resend = useResendNotification();

  const [search, setSearch] = React.useState("");
  const [statut, setStatut] = React.useState(ALL);
  const [canal, setCanal] = React.useState(ALL);

  const [formOpen, setFormOpen] = React.useState(false);
  const [resendTarget, setResendTarget] = React.useState<NotificationResponse | undefined>(
    undefined,
  );

  const notifications = React.useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );

  const userById = React.useMemo(() => {
    const map = new Map<string, { label: string; role: string }>();
    for (const u of usersQuery.data ?? []) {
      const name = u.nom || u.prenom ? `${(u.nom ?? "").toUpperCase()} ${u.prenom ?? ""}`.trim() : u.email;
      map.set(u.id, { label: name, role: ROLE_LABELS[u.role] });
    }
    return map;
  }, [usersQuery.data]);

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notifications) {
      counts.set(n.statut_envoi, (counts.get(n.statut_envoi) ?? 0) + 1);
    }
    return counts;
  }, [notifications]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      if (statut !== ALL && notification.statut_envoi !== statut) return false;
      if (canal !== ALL && notification.canal !== canal) return false;
      if (query) {
        const dest = userById.get(notification.destinataire_id);
        const haystack = `${dest?.label ?? ""} ${notification.message}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [notifications, statut, canal, search, userById]);

  const columns: DataTableColumn<NotificationResponse>[] = [
    {
      id: "destinataire",
      header: "Destinataire",
      cell: (notification) => {
        const dest = userById.get(notification.destinataire_id);
        return dest ? (
          <span>
            <span className="font-medium">{dest.label}</span>{" "}
            <span className="text-xs text-muted-foreground">({dest.role})</span>
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {notification.destinataire_id}
          </span>
        );
      },
      sortValue: (notification) => userById.get(notification.destinataire_id)?.label ?? "",
    },
    {
      id: "message",
      header: "Message",
      cell: (notification) => (
        <span className="block max-w-[16rem] truncate lg:max-w-md" title={notification.message}>
          {notification.message}
        </span>
      ),
      hideBelow: "md",
    },
    {
      id: "canal",
      header: "Canal",
      cell: (notification) => CANAL_ENVOI[notification.canal],
      sortValue: (notification) => notification.canal,
      hideBelow: "lg",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (notification) => (
        <span title={notification.erreur ?? undefined}>
          <EnumBadge map={STATUT_ENVOI} value={notification.statut_envoi} />
        </span>
      ),
      sortValue: (notification) => notification.statut_envoi,
    },
    {
      id: "date",
      header: "Créée le",
      cell: (notification) => formatDateTime(notification.created_at),
      sortValue: (notification) => notification.created_at,
      hideBelow: "md",
    },
    ...(canSend
      ? [
          {
            id: "actions",
            header: "",
            className: "w-12 text-right",
            cell: (notification: NotificationResponse) =>
              notification.statut_envoi !== "ENVOYE" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions sur la notification">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setResendTarget(notification)}>
                      <RefreshCw /> Renvoyer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null,
          } satisfies DataTableColumn<NotificationResponse>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Messages SMS, WhatsApp et e-mail envoyés aux comptes de l'établissement."
      >
        {canSend ? (
          <Button onClick={() => setFormOpen(true)}>
            <Send /> Nouvelle notification
          </Button>
        ) : null}
      </PageHeader>

      {/* Filtres rapides par statut d'envoi, avec compteurs */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer par statut d'envoi"
      >
        {(
          [
            [ALL, "Toutes", notifications.length],
            ...Object.entries(STATUT_ENVOI).map(
              ([value, style]) => [value, style.label, statusCounts.get(value) ?? 0] as const,
            ),
          ] as const
        ).map(([value, label, count]) => {
          const active = statut === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatut(value)}
              aria-pressed={active}
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
              }
            >
              {label}
              <span
                className={
                  active
                    ? "rounded-full bg-white/20 px-1.5 tabular-nums"
                    : "rounded-full bg-muted px-1.5 tabular-nums"
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (destinataire, message)…"
            className="pl-8"
            aria-label="Rechercher une notification"
          />
        </div>
        <Select value={canal} onValueChange={setCanal}>
          <SelectTrigger className="w-40" aria-label="Filtrer par canal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les canaux</SelectItem>
            {Object.entries(CANAL_ENVOI).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {notificationsQuery.isError ? (
        <ErrorState
          error={notificationsQuery.error}
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(notification) => notification.id}
          isLoading={notificationsQuery.isPending}
          pageSize={12}
          emptyState={
            notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Aucune notification"
                description={
                  canSend
                    ? "Envoyez le premier message — SMS, WhatsApp ou e-mail."
                    : "Aucun message envoyé pour l'instant."
                }
                action={
                  canSend ? (
                    <Button onClick={() => setFormOpen(true)}>
                      <Send /> Nouvelle notification
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucune notification ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <NotificationFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={resendTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setResendTarget(undefined);
        }}
        title="Renvoyer la notification"
        description={
          resendTarget
            ? `Retenter l'envoi via ${CANAL_ENVOI[resendTarget.canal]} à ${
                userById.get(resendTarget.destinataire_id)?.label ?? "ce destinataire"
              } ?${resendTarget.erreur ? ` Dernière erreur : ${resendTarget.erreur}` : ""}`
            : undefined
        }
        confirmLabel="Renvoyer"
        loading={resend.isPending}
        onConfirm={() => {
          if (!resendTarget) return;
          resend.mutate(resendTarget.id, { onSuccess: () => setResendTarget(undefined) });
        }}
      />
    </div>
  );
}
