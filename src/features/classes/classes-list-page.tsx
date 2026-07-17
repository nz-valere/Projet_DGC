import { BookCopy, MoreHorizontal, Pencil, Plus, School, Search, Trash2 } from "lucide-react";
import * as React from "react";
import type { ClasseResponse } from "@/api/types";
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
import { useClasses, useDeleteClasse } from "./api";
import { ClasseFormDialog } from "./classe-form-dialog";
import { ClasseMatieresDialog } from "./classe-matieres-dialog";

export function ClassesListPage() {
  const classesQuery = useClasses();
  const deleteClasse = useDeleteClasse();

  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ClasseResponse | undefined>(undefined);
  const [matieresTarget, setMatieresTarget] = React.useState<ClasseResponse | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<ClasseResponse | undefined>(undefined);

  const classes = React.useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classes;
    return classes.filter((classe) =>
      `${classe.nom} ${classe.filiere} ${classe.niveau ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [classes, search]);

  const columns: DataTableColumn<ClasseResponse>[] = [
    {
      id: "nom",
      header: "Classe",
      cell: (classe) => <span className="font-medium">{classe.nom}</span>,
      sortValue: (classe) => classe.nom,
    },
    {
      id: "filiere",
      header: "Filière",
      cell: (classe) => classe.filiere,
      sortValue: (classe) => classe.filiere,
    },
    {
      id: "niveau",
      header: "Niveau",
      cell: (classe) => classe.niveau ?? "—",
      sortValue: (classe) => classe.niveau ?? "",
      hideBelow: "sm",
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (classe) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions pour ${classe.nom}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditTarget(classe)}>
              <Pencil /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setMatieresTarget(classe)}>
              <BookCopy /> Gérer les matières
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteTarget(classe)}
            >
              <Trash2 /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Classes" description="Filières, niveaux et matières par classe.">
        <Button onClick={() => setFormOpen(true)}>
          <Plus /> Nouvelle classe
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (nom, filière, année)…"
            className="pl-8"
            aria-label="Rechercher une classe"
          />
        </div>
      </div>

      {classesQuery.isError ? (
        <ErrorState error={classesQuery.error} onRetry={() => void classesQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(classe) => classe.id}
          onRowClick={(classe) => setMatieresTarget(classe)}
          isLoading={classesQuery.isPending}
          pageSize={10}
          emptyState={
            classes.length === 0 ? (
              <EmptyState
                icon={School}
                title="Aucune classe"
                description="Créez une première classe pour pouvoir y inscrire des étudiants."
                action={
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus /> Nouvelle classe
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucune classe ne correspond à cette recherche."
              />
            )
          }
        />
      )}

      <ClasseFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ClasseFormDialog
        open={editTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        classe={editTarget}
      />

      {matieresTarget ? (
        <ClasseMatieresDialog
          open={matieresTarget !== undefined}
          onOpenChange={(open) => {
            if (!open) setMatieresTarget(undefined);
          }}
          classe={matieresTarget}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Supprimer la classe"
        description={
          deleteTarget
            ? `Supprimer définitivement la classe « ${deleteTarget.nom} » ? Les étudiants rattachés ne pourront plus y être liés.`
            : undefined
        }
        confirmLabel="Supprimer"
        destructive
        loading={deleteClasse.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteClasse.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(undefined),
          });
        }}
      />
    </div>
  );
}
