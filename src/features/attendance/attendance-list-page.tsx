import { CalendarCheck, CalendarPlus, MoreHorizontal, Pencil, Search } from "lucide-react";
import * as React from "react";
import type { AttendanceResponse } from "@/api/types";
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
import { useClasses } from "@/features/classes/api";
import { useMatieres } from "@/features/matieres/api";
import { useSeances } from "@/features/seances/api";
import { useStudents } from "@/features/students/api";
import { STATUT_PRESENCE } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { useAttendance } from "./api";
import { AttendanceCorrectDialog } from "./attendance-correct-dialog";
import { AttendanceFormDialog } from "./attendance-form-dialog";

const ALL = "__all__";

export function AttendanceListPage() {
  const user = useCurrentUser();
  /** WF-03 : la saisie et la correction sont réservées au rôle ADMIN (DIRECTION exclue). */
  const canEdit = user.role === "ADMIN";

  const attendanceQuery = useAttendance();
  const studentsQuery = useStudents();
  const seancesQuery = useSeances();
  const classesQuery = useClasses();
  const matieresQuery = useMatieres();

  const [search, setSearch] = React.useState("");
  const [statut, setStatut] = React.useState(ALL);
  const [classe, setClasse] = React.useState(ALL);

  const [formOpen, setFormOpen] = React.useState(false);
  const [correctTarget, setCorrectTarget] = React.useState<AttendanceResponse | undefined>(
    undefined,
  );

  const records = React.useMemo(() => attendanceQuery.data ?? [], [attendanceQuery.data]);

  const studentById = React.useMemo(() => {
    const map = new Map<string, { name: string; classeId: string | null }>();
    for (const s of studentsQuery.data ?? []) {
      map.set(s.id, { name: `${s.nom.toUpperCase()} ${s.prenom}`, classeId: s.classe_id ?? null });
    }
    return map;
  }, [studentsQuery.data]);

  const classeById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const matiereById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matieresQuery.data ?? []) map.set(m.id, m.nom);
    return map;
  }, [matieresQuery.data]);

  const seanceById = React.useMemo(() => {
    const map = new Map<string, { label: string; matiere: string }>();
    for (const s of seancesQuery.data ?? []) {
      map.set(s.id, {
        label: `${s.heure_debut}–${s.heure_fin}`,
        matiere: matiereById.get(s.matiere_id) ?? "—",
      });
    }
    return map;
  }, [seancesQuery.data, matiereById]);

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records) counts.set(record.statut, (counts.get(record.statut) ?? 0) + 1);
    return counts;
  }, [records]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (statut !== ALL && record.statut !== statut) return false;
      const student = studentById.get(record.student_id);
      if (classe !== ALL && student?.classeId !== classe) return false;
      if (query) {
        const seance = seanceById.get(record.seance_id);
        const haystack = `${student?.name ?? ""} ${seance?.matiere ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [records, statut, classe, search, studentById, seanceById]);

  const columns: DataTableColumn<AttendanceResponse>[] = [
    {
      id: "date",
      header: "Date",
      cell: (record) => formatDate(record.date),
      sortValue: (record) => record.date,
    },
    {
      id: "etudiant",
      header: "Étudiant",
      cell: (record) => (
        <span className="font-medium">{studentById.get(record.student_id)?.name ?? "—"}</span>
      ),
      sortValue: (record) => studentById.get(record.student_id)?.name ?? "",
    },
    {
      id: "classe",
      header: "Classe",
      cell: (record) => {
        const classeId = studentById.get(record.student_id)?.classeId;
        return classeId ? (classeById.get(classeId) ?? "—") : "—";
      },
      sortValue: (record) => {
        const classeId = studentById.get(record.student_id)?.classeId;
        return classeId ? (classeById.get(classeId) ?? "") : "";
      },
      hideBelow: "md",
    },
    {
      id: "seance",
      header: "Séance",
      hideBelow: "lg",
      cell: (record) => {
        const seance = seanceById.get(record.seance_id);
        return seance ? (
          <span className="text-sm">
            {seance.matiere}{" "}
            <span className="tabular-nums text-xs text-muted-foreground">{seance.label}</span>
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{record.seance_id}</span>
        );
      },
      sortValue: (record) => seanceById.get(record.seance_id)?.matiere ?? "",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (record) => <EnumBadge map={STATUT_PRESENCE} value={record.statut} />,
      sortValue: (record) => record.statut,
    },
    {
      id: "motif",
      header: "Motif",
      cell: (record) => record.motif ?? "—",
      hideBelow: "md",
    },
    {
      id: "correction",
      header: "Correction",
      hideBelow: "lg",
      cell: (record) =>
        record.motif_correction ? (
          <span className="text-xs text-muted-foreground" title={record.motif_correction}>
            {record.statut_precedent ? `${record.statut_precedent} → ${record.statut} · ` : ""}
            {record.motif_correction}
          </span>
        ) : (
          "—"
        ),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            className: "w-12 text-right",
            cell: (record: AttendanceResponse) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions sur la présence">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setCorrectTarget(record)}>
                    <Pencil /> Corriger (avec motif)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          } satisfies DataTableColumn<AttendanceResponse>,
        ]
      : []),
  ];

  const classes = classesQuery.data ?? [];

  return (
    <div>
      <PageHeader title="Présences" description="Relevé par séance, corrections tracées.">
        {canEdit ? (
          <Button onClick={() => setFormOpen(true)}>
            <CalendarPlus /> Saisir une présence
          </Button>
        ) : null}
      </PageHeader>

      {/* Filtres rapides par statut, avec compteurs */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer par statut"
      >
        {(
          [
            [ALL, "Toutes", records.length],
            ...Object.entries(STATUT_PRESENCE).map(
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
            placeholder="Rechercher (étudiant, matière)…"
            className="pl-8"
            aria-label="Rechercher une présence"
          />
        </div>
        <Select value={classe} onValueChange={setClasse}>
          <SelectTrigger className="w-44" aria-label="Filtrer par classe">
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

      {attendanceQuery.isError ? (
        <ErrorState error={attendanceQuery.error} onRetry={() => void attendanceQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(record) => record.id}
          isLoading={attendanceQuery.isPending || studentsQuery.isPending}
          pageSize={12}
          emptyState={
            records.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Aucune présence"
                description={
                  canEdit
                    ? "Saisissez le premier relevé pour une séance planifiée."
                    : "Aucun relevé de présence pour l'instant."
                }
                action={
                  canEdit ? (
                    <Button onClick={() => setFormOpen(true)}>
                      <CalendarPlus /> Saisir une présence
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucune présence ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <AttendanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {correctTarget ? (
        <AttendanceCorrectDialog
          key={correctTarget.id}
          open
          onOpenChange={(open) => {
            if (!open) setCorrectTarget(undefined);
          }}
          attendance={correctTarget}
          studentName={studentById.get(correctTarget.student_id)?.name}
        />
      ) : null}
    </div>
  );
}
