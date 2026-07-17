import { CalendarClock, CalendarPlus } from "lucide-react";
import * as React from "react";
import type { SeanceResponse } from "@/api/types";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/features/classes/api";
import { useMatieres } from "@/features/matieres/api";
import { useUsers } from "@/features/users/api";
import { formatDate } from "@/lib/utils";
import { useSeances } from "./api";
import { SeanceFormDialog } from "./seance-form-dialog";

const ALL = "__all__";

export function SeancesListPage() {
  const seancesQuery = useSeances();
  const classesQuery = useClasses();
  const matieresQuery = useMatieres();
  const enseignantsQuery = useUsers("ENSEIGNANT");

  const [classe, setClasse] = React.useState(ALL);
  const [formOpen, setFormOpen] = React.useState(false);

  const seances = React.useMemo(() => seancesQuery.data ?? [], [seancesQuery.data]);

  const classesById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);
  const matieresById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matieresQuery.data ?? []) map.set(m.id, m.nom);
    return map;
  }, [matieresQuery.data]);
  const enseignantsById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enseignantsQuery.data ?? []) map.set(e.id, e.email);
    return map;
  }, [enseignantsQuery.data]);

  const filtered = React.useMemo(
    () => (classe === ALL ? seances : seances.filter((s) => s.classe_id === classe)),
    [seances, classe],
  );

  const columns: DataTableColumn<SeanceResponse>[] = [
    {
      id: "date",
      header: "Date",
      cell: (s) => formatDate(s.date),
      sortValue: (s) => s.date,
    },
    {
      id: "creneau",
      header: "Créneau",
      cell: (s) => (
        <span className="font-mono text-xs">
          {s.heure_debut}–{s.heure_fin}
        </span>
      ),
      sortValue: (s) => s.heure_debut,
    },
    {
      id: "classe",
      header: "Classe",
      cell: (s) => classesById.get(s.classe_id) ?? "—",
      sortValue: (s) => classesById.get(s.classe_id) ?? "",
    },
    {
      id: "matiere",
      header: "Matière",
      cell: (s) => matieresById.get(s.matiere_id) ?? "—",
      sortValue: (s) => matieresById.get(s.matiere_id) ?? "",
    },
    {
      id: "enseignant",
      header: "Enseignant",
      cell: (s) => enseignantsById.get(s.enseignant_id) ?? "—",
      sortValue: (s) => enseignantsById.get(s.enseignant_id) ?? "",
      hideBelow: "lg",
    },
    {
      id: "salle",
      header: "Salle",
      cell: (s) => s.salle ?? "—",
      sortValue: (s) => s.salle ?? "",
      hideBelow: "md",
    },
  ];

  const classes = classesQuery.data ?? [];

  return (
    <div>
      <PageHeader title="Séances" description="Planning des séances par classe et enseignant.">
        <Button onClick={() => setFormOpen(true)}>
          <CalendarPlus /> Planifier une séance
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={classe} onValueChange={setClasse}>
          <SelectTrigger className="w-52" aria-label="Filtrer par classe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {seancesQuery.isError ? (
        <ErrorState error={seancesQuery.error} onRetry={() => void seancesQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(s) => s.id}
          isLoading={seancesQuery.isPending}
          pageSize={12}
          emptyState={
            <EmptyState
              icon={CalendarClock}
              title="Aucune séance"
              description="Planifiez une première séance pour cette classe."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <CalendarPlus /> Planifier une séance
                </Button>
              }
            />
          }
        />
      )}

      <SeanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
