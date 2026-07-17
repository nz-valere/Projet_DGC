import {
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { UserResponse } from "@/api/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useOnlinePresence } from "@/features/presence/api";
import { useSetUserActive, useUsers } from "@/features/users/api";
import { ROLE_LABELS } from "@/lib/labels";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { PersonnelFormDialog, STAFF_ROLES } from "./personnel-form-dialog";
import { ActiveBadge, RoleBadge } from "./role-badge";

const ALL = "__all__";

export function PersonnelListPage() {
  const navigate = useNavigate();
  const usersQuery = useUsers();
  const setActive = useSetUserActive();
  // Le module Personnel est réservé à DIRECTION/ADMIN : /presence/online est autorisé.
  const presenceQuery = useOnlinePresence();

  const onlineIds = React.useMemo(
    () => new Set((presenceQuery.data?.utilisateurs ?? []).map((u) => u.id)),
    [presenceQuery.data],
  );

  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState(ALL);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<UserResponse | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = React.useState<UserResponse | undefined>(undefined);

  /** Personnel uniquement : les comptes étudiants/parents sont gérés ailleurs. */
  const staff = React.useMemo(
    () =>
      (usersQuery.data ?? []).filter((user) =>
        (STAFF_ROLES as readonly string[]).includes(user.role),
      ),
    [usersQuery.data],
  );

  const roleCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of staff) counts.set(user.role, (counts.get(user.role) ?? 0) + 1);
    return counts;
  }, [staff]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((user) => {
      if (role !== ALL && user.role !== role) return false;
      if (query) {
        const haystack = `${user.email} ${user.matricule ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [staff, role, search]);

  const columns: DataTableColumn<UserResponse>[] = [
    {
      id: "membre",
      header: "Membre",
      cell: (user) => {
        const online = onlineIds.has(user.id);
        return (
          <span className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold uppercase text-accent-foreground">
              {user.email.slice(0, 2)}
              {online ? (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500"
                  title="En ligne"
                />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{user.email.split("@")[0]}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </span>
        );
      },
      sortValue: (user) => user.email,
    },
    {
      id: "role",
      header: "Rôle",
      cell: (user) => <RoleBadge role={user.role} />,
      sortValue: (user) => ROLE_LABELS[user.role],
    },
    {
      id: "matricule",
      header: "Matricule",
      cell: (user) =>
        user.matricule ? <span className="font-mono text-xs">{user.matricule}</span> : "—",
      sortValue: (user) => user.matricule ?? "",
      hideBelow: "md",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (user) => <ActiveBadge active={user.is_active} />,
      sortValue: (user) => (user.is_active ? 0 : 1),
    },
    {
      id: "activite",
      header: "Dernière activité",
      cell: (user) => {
        if (onlineIds.has(user.id)) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              En ligne
            </span>
          );
        }
        const last = user.derniere_activite ?? user.derniere_connexion;
        return last ? (
          <span className="text-xs text-muted-foreground" title={formatDateTime(last)}>
            {formatRelativeTime(last)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Jamais connecté</span>
        );
      },
      // Jamais connecté en dernier : on trie sur l'horodatage décroissant.
      sortValue: (user) => user.derniere_activite ?? user.derniere_connexion ?? "",
      hideBelow: "lg",
    },
    {
      id: "cree",
      header: "Créé le",
      cell: (user) => formatDate(user.created_at),
      sortValue: (user) => user.created_at,
      hideBelow: "xl",
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions pour ${user.email}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onSelect={() => navigate(`/personnel/${user.id}`)}>
              <Eye /> Voir la fiche
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditTarget(user)}>
              <Pencil /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.is_active ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setToggleTarget(user)}
              >
                <PowerOff /> Désactiver
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setToggleTarget(user)}>
                <Power /> Réactiver
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Personnel"
        description="Comptes de l'équipe : direction, administration, secrétariat, comptabilité, enseignants."
      >
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus /> Nouveau compte
        </Button>
      </PageHeader>

      {/* Filtres rapides par rôle, avec compteurs */}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par rôle">
        {(
          [
            [ALL, "Tous", staff.length] as const,
            ...STAFF_ROLES.map(
              (value) => [value, ROLE_LABELS[value], roleCounts.get(value) ?? 0] as const,
            ),
          ] as readonly (readonly [string, string, number])[]
        ).map(([value, label, count]) => {
          const active = role === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
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
            placeholder="Rechercher (e-mail, matricule)…"
            className="pl-8"
            aria-label="Rechercher un membre du personnel"
          />
        </div>
      </div>

      {usersQuery.isError ? (
        <ErrorState error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(user) => user.id}
          onRowClick={(user) => navigate(`/personnel/${user.id}`)}
          isLoading={usersQuery.isPending}
          pageSize={10}
          emptyState={
            staff.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun compte du personnel"
                description="Créez les comptes de l'équipe : ils sont actifs immédiatement."
                action={
                  <Button onClick={() => setFormOpen(true)}>
                    <UserPlus /> Nouveau compte
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucun membre ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <PersonnelFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <PersonnelFormDialog
        open={editTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        user={editTarget}
      />

      <ConfirmDialog
        open={toggleTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(undefined);
        }}
        title={toggleTarget?.is_active ? "Désactiver le compte" : "Réactiver le compte"}
        description={
          toggleTarget
            ? toggleTarget.is_active
              ? `${toggleTarget.email} ne pourra plus se connecter. Son historique (notes, séances…) est conservé.`
              : `${toggleTarget.email} pourra de nouveau se connecter.`
            : undefined
        }
        confirmLabel={toggleTarget?.is_active ? "Désactiver" : "Réactiver"}
        destructive={toggleTarget?.is_active}
        loading={setActive.isPending}
        onConfirm={() => {
          if (!toggleTarget) return;
          setActive.mutate(
            { userId: toggleTarget.id, active: !toggleTarget.is_active },
            { onSuccess: () => setToggleTarget(undefined) },
          );
        }}
      />
    </div>
  );
}
