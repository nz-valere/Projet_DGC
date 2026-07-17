import {
  CheckCircle2,
  Eye,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { StudentResponse } from "@/api/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { EnumBadge } from "@/components/shared/status-badge";
import { STATUT_INSCRIPTION } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useClasses } from "@/features/classes/api";
import { useDeleteStudent, useStudents, useValidateStudent } from "./api";
import { RejectStudentDialog } from "./reject-student-dialog";
import { StudentFormDialog } from "./student-form-dialog";

const ALL = "__all__";

function StudentStatusBadge({ student }: { student: StudentResponse }) {
  return <EnumBadge map={STATUT_INSCRIPTION} value={student.statut} />;
}

export function StudentsListPage() {
  const navigate = useNavigate();
  const studentsQuery = useStudents();
  const validateStudent = useValidateStudent();
  const deleteStudent = useDeleteStudent();

  const [search, setSearch] = React.useState("");
  const [filiere, setFiliere] = React.useState(ALL);
  const [classe, setClasse] = React.useState(ALL);
  const [statut, setStatut] = React.useState(ALL);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<StudentResponse | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<StudentResponse | undefined>(undefined);
  const [validateTarget, setValidateTarget] = React.useState<StudentResponse | undefined>(
    undefined,
  );
  const [rejectTarget, setRejectTarget] = React.useState<StudentResponse | undefined>(undefined);

  const students = React.useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const classesQuery = useClasses();
  const classesById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const classe of classesQuery.data ?? []) map.set(classe.id, classe.nom);
    return map;
  }, [classesQuery.data]);
  const classeName = React.useCallback(
    (id: string | null | undefined) => (id ? (classesById.get(id) ?? "—") : "—"),
    [classesById],
  );

  const filieres = React.useMemo(
    () => [...new Set(students.map((student) => student.filiere))].sort(),
    [students],
  );
  const classes = React.useMemo(
    () =>
      [...(classesQuery.data ?? [])]
        .filter((classe) => students.some((student) => student.classe_id === classe.id))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [classesQuery.data, students],
  );

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of students) {
      counts.set(student.statut, (counts.get(student.statut) ?? 0) + 1);
    }
    return counts;
  }, [students]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      if (filiere !== ALL && student.filiere !== filiere) return false;
      if (classe !== ALL && student.classe_id !== classe) return false;
      if (statut !== ALL && student.statut !== statut) return false;
      if (query) {
        const haystack =
          `${student.nom} ${student.prenom} ${student.matricule}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [students, search, filiere, classe, statut]);

  const columns: DataTableColumn<StudentResponse>[] = [
    {
      id: "matricule",
      header: "Matricule",
      cell: (student) => <span className="font-mono text-xs">{student.matricule}</span>,
      sortValue: (student) => student.matricule,
      hideBelow: "md",
    },
    {
      id: "nom",
      header: "Nom",
      cell: (student) => (
        <span className="font-medium">
          {student.nom.toUpperCase()} {student.prenom}
        </span>
      ),
      sortValue: (student) => `${student.nom} ${student.prenom}`,
    },
    {
      id: "filiere",
      header: "Filière",
      cell: (student) => student.filiere,
      sortValue: (student) => student.filiere,
      hideBelow: "md",
    },
    {
      id: "classe",
      header: "Classe",
      cell: (student) => classeName(student.classe_id),
      sortValue: (student) => classeName(student.classe_id),
      hideBelow: "md",
    },
    {
      id: "annee",
      header: "Année",
      cell: (student) => student.annee_academique,
      sortValue: (student) => student.annee_academique,
      hideBelow: "lg",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (student) => <StudentStatusBadge student={student} />,
      sortValue: (student) => student.statut,
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions pour ${student.prenom} ${student.nom}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onSelect={() => navigate(`/etudiants/${student.id}`)}>
              <Eye /> Voir la fiche
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditTarget(student)}>
              <Pencil /> Modifier
            </DropdownMenuItem>
            {student.statut === "EN_ATTENTE_VALIDATION" ? (
              <>
                <DropdownMenuItem onSelect={() => setValidateTarget(student)}>
                  <CheckCircle2 /> Valider l'inscription
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRejectTarget(student)}>
                  <XCircle /> Rejeter la demande
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteTarget(student)}
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
      <PageHeader
        title="Étudiants"
        description="Inscriptions, dossiers scolaires et suivi des étudiants."
      >
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus /> Nouvelle inscription
        </Button>
      </PageHeader>

      {/* File de travail : filtres rapides par statut d'inscription, avec compteurs */}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par statut">
        {(
          [
            [ALL, "Tous", students.length],
            ["EN_ATTENTE_VALIDATION", "À valider", statusCounts.get("EN_ATTENTE_VALIDATION") ?? 0],
            [
              "EN_ATTENTE_ACTIVATION",
              "Activation en attente",
              statusCounts.get("EN_ATTENTE_ACTIVATION") ?? 0,
            ],
            ["INSCRIT", "Inscrits", statusCounts.get("INSCRIT") ?? 0],
            ["REJETE", "Rejetés", statusCounts.get("REJETE") ?? 0],
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
            placeholder="Rechercher (nom, prénom, matricule)…"
            className="pl-8"
            aria-label="Rechercher un étudiant"
          />
        </div>
        <Select value={filiere} onValueChange={setFiliere}>
          <SelectTrigger className="w-44" aria-label="Filtrer par filière">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les filières</SelectItem>
            {filieres.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classe} onValueChange={setClasse}>
          <SelectTrigger className="w-40" aria-label="Filtrer par classe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les classes</SelectItem>
            {classes.map((classe) => (
              <SelectItem key={classe.id} value={classe.id}>
                {classe.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {studentsQuery.isError ? (
        <ErrorState error={studentsQuery.error} onRetry={() => void studentsQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(student) => student.id}
          onRowClick={(student) => navigate(`/etudiants/${student.id}`)}
          isLoading={studentsQuery.isPending}
          pageSize={10}
          emptyState={
            students.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Aucun étudiant inscrit"
                description="Commencez par enregistrer une première inscription."
                action={
                  <Button onClick={() => setFormOpen(true)}>
                    <UserPlus /> Nouvelle inscription
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucun étudiant ne correspond à ces critères de recherche."
              />
            )
          }
        />
      )}

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <StudentFormDialog
        open={editTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        student={editTarget}
      />

      <RejectStudentDialog
        open={rejectTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(undefined);
        }}
        student={rejectTarget}
      />

      <ConfirmDialog
        open={validateTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setValidateTarget(undefined);
        }}
        title="Valider l'inscription"
        description={
          validateTarget
            ? `Confirmer l'inscription définitive de ${validateTarget.prenom} ${validateTarget.nom} ? Le dossier ne sera plus en brouillon.`
            : undefined
        }
        confirmLabel="Valider l'inscription"
        loading={validateStudent.isPending}
        onConfirm={() => {
          if (!validateTarget) return;
          validateStudent.mutate(validateTarget.id, {
            onSuccess: () => setValidateTarget(undefined),
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Supprimer le dossier"
        description={
          deleteTarget
            ? `Supprimer définitivement le dossier de ${deleteTarget.prenom} ${deleteTarget.nom} (${deleteTarget.matricule}) ? Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        destructive
        loading={deleteStudent.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteStudent.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(undefined),
          });
        }}
      />
    </div>
  );
}
