import {
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import * as React from "react";
import type { GradeResponse } from "@/api/types";
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
import { useCurrentUser } from "@/features/auth/auth-context";
import { useClasses } from "@/features/classes/api";
import { useMatieres } from "@/features/matieres/api";
import { useStudents } from "@/features/students/api";
import { STATUT_NOTE, TYPE_EVALUATION } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { useGrades, usePublishGrade, useValidateGrade } from "./api";
import { GradeFormDialog } from "./grade-form-dialog";
import { PonderationButton } from "./ponderation-dialog";

const ALL = "__all__";

export function GradesListPage() {
  const user = useCurrentUser();
  /** Valider / rejeter / publier : réservé à la direction et à l'administration. */
  const canModerate = user.role === "DIRECTION" || user.role === "ADMIN";

  const gradesQuery = useGrades();
  const studentsQuery = useStudents();
  const matieresQuery = useMatieres();
  const classesQuery = useClasses();
  const validateGrade = useValidateGrade();
  const publishGrade = usePublishGrade();

  const [search, setSearch] = React.useState("");
  const [matiere, setMatiere] = React.useState(ALL);
  const [classe, setClasse] = React.useState(ALL);
  const [statut, setStatut] = React.useState(ALL);
  const [semestre, setSemestre] = React.useState(ALL);
  const [typeEvaluation, setTypeEvaluation] = React.useState(ALL);
  const [onlyAlertes, setOnlyAlertes] = React.useState(false);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<GradeResponse | undefined>(undefined);
  const [validateTarget, setValidateTarget] = React.useState<GradeResponse | undefined>(undefined);
  const [rejectTarget, setRejectTarget] = React.useState<GradeResponse | undefined>(undefined);
  const [publishTarget, setPublishTarget] = React.useState<GradeResponse | undefined>(undefined);

  const grades = React.useMemo(() => gradesQuery.data ?? [], [gradesQuery.data]);

  const studentById = React.useMemo(() => {
    const map = new Map<string, { name: string; classeId: string | null }>();
    for (const s of studentsQuery.data ?? []) {
      map.set(s.id, {
        name: `${s.nom.toUpperCase()} ${s.prenom}`,
        classeId: s.classe_id ?? null,
      });
    }
    return map;
  }, [studentsQuery.data]);

  const matiereById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matieresQuery.data ?? []) map.set(m.id, m.nom);
    return map;
  }, [matieresQuery.data]);

  const classeById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const grade of grades) counts.set(grade.statut, (counts.get(grade.statut) ?? 0) + 1);
    return counts;
  }, [grades]);

  const alertesCount = React.useMemo(
    () => grades.filter((grade) => Boolean(grade.alerte)).length,
    [grades],
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return grades.filter((grade) => {
      if (onlyAlertes && !grade.alerte) return false;
      if (statut !== ALL && grade.statut !== statut) return false;
      if (matiere !== ALL && grade.matiere_id !== matiere) return false;
      if (semestre !== ALL && grade.semestre !== semestre) return false;
      if (typeEvaluation !== ALL && grade.type_evaluation !== typeEvaluation) return false;
      const student = studentById.get(grade.student_id);
      if (classe !== ALL && student?.classeId !== classe) return false;
      if (query) {
        const haystack =
          `${student?.name ?? ""} ${matiereById.get(grade.matiere_id) ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [
    grades,
    onlyAlertes,
    statut,
    matiere,
    classe,
    semestre,
    typeEvaluation,
    search,
    studentById,
    matiereById,
  ]);

  const columns: DataTableColumn<GradeResponse>[] = [
    {
      id: "etudiant",
      header: "Étudiant",
      cell: (grade) => (
        <span className="font-medium">{studentById.get(grade.student_id)?.name ?? "—"}</span>
      ),
      sortValue: (grade) => studentById.get(grade.student_id)?.name ?? "",
    },
    {
      id: "classe",
      header: "Classe",
      cell: (grade) => {
        const classeId = studentById.get(grade.student_id)?.classeId;
        return classeId ? (classeById.get(classeId) ?? "—") : "—";
      },
      sortValue: (grade) => {
        const classeId = studentById.get(grade.student_id)?.classeId;
        return classeId ? (classeById.get(classeId) ?? "") : "";
      },
      hideBelow: "lg",
    },
    {
      id: "matiere",
      header: "Matière",
      cell: (grade) => matiereById.get(grade.matiere_id) ?? "—",
      sortValue: (grade) => matiereById.get(grade.matiere_id) ?? "",
      hideBelow: "md",
    },
    {
      id: "note",
      header: "Note",
      cell: (grade) => (
        <span className="tabular-nums">
          <span className="font-semibold">{grade.valeur}</span>
          <span className="text-muted-foreground"> / {grade.bareme}</span>
          {grade.valeur_precedente !== null && grade.valeur_precedente !== undefined ? (
            <span
              className="ml-1.5 text-xs text-muted-foreground"
              title={grade.motif_modification ?? undefined}
            >
              (avant : {grade.valeur_precedente})
            </span>
          ) : null}
          {grade.alerte ? (
            <span title={grade.alerte} className="ml-1.5 inline-flex align-middle">
              <TriangleAlert className="h-4 w-4 text-amber-600" aria-label={`Alerte : ${grade.alerte}`} />
            </span>
          ) : null}
        </span>
      ),
      sortValue: (grade) => grade.valeur / (grade.bareme || 1),
    },
    {
      id: "periode",
      header: "Période",
      cell: (grade) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
          <span className="tabular-nums text-muted-foreground">
            {grade.annee_academique} · {grade.semestre}
          </span>
          <EnumBadge map={TYPE_EVALUATION} value={grade.type_evaluation} />
        </span>
      ),
      sortValue: (grade) =>
        `${grade.annee_academique}-${grade.semestre}-${grade.type_evaluation}`,
      hideBelow: "lg",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (grade) => <EnumBadge map={STATUT_NOTE} value={grade.statut} />,
      sortValue: (grade) => grade.statut,
    },
    {
      id: "date",
      header: "Saisie le",
      cell: (grade) => formatDate(grade.created_at),
      sortValue: (grade) => grade.created_at,
      hideBelow: "xl",
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (grade) => {
        const showValidate = canModerate && grade.statut === "EN_ATTENTE";
        const showPublish = canModerate && grade.statut === "VALIDE";
        const showReject =
          canModerate && (grade.statut === "EN_ATTENTE" || grade.statut === "VALIDE");
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions sur la note">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showValidate ? (
                <DropdownMenuItem onSelect={() => setValidateTarget(grade)}>
                  <CheckCircle2 /> Valider
                </DropdownMenuItem>
              ) : null}
              {showPublish ? (
                <DropdownMenuItem onSelect={() => setPublishTarget(grade)}>
                  <Send /> Publier
                </DropdownMenuItem>
              ) : null}
              {showReject ? (
                <DropdownMenuItem onSelect={() => setRejectTarget(grade)}>
                  <XCircle /> Rejeter
                </DropdownMenuItem>
              ) : null}
              {showValidate || showPublish || showReject ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem onSelect={() => setEditTarget(grade)}>
                <Pencil /> Modifier (avec motif)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const matieres = matieresQuery.data ?? [];
  const classes = classesQuery.data ?? [];

  return (
    <div>
      <PageHeader title="Notes" description="Saisie, validation et publication des notes.">
        {canModerate ? <PonderationButton /> : null}
        <Button onClick={() => setFormOpen(true)}>
          <ClipboardPlus /> Saisir une note
        </Button>
      </PageHeader>

      {/* Filtres rapides par statut, avec compteurs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par statut">
        {(
          [
            [ALL, "Toutes", grades.length],
            ["EN_ATTENTE", "En attente", statusCounts.get("EN_ATTENTE") ?? 0],
            ["VALIDE", "Validées", statusCounts.get("VALIDE") ?? 0],
            ["PUBLIE", "Publiées", statusCounts.get("PUBLIE") ?? 0],
            ["REJETE", "Rejetées", statusCounts.get("REJETE") ?? 0],
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

        {/* Notes signalées par le backend (champ `alerte`) : se combine avec le statut. */}
        {alertesCount > 0 ? (
          <>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setOnlyAlertes((previous) => !previous)}
              aria-pressed={onlyAlertes}
              className={
                onlyAlertes
                  ? "inline-flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:border-amber-500"
              }
            >
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Alertes
              <span
                className={
                  onlyAlertes
                    ? "rounded-full bg-white/25 px-1.5 tabular-nums"
                    : "rounded-full bg-amber-200/70 px-1.5 tabular-nums"
                }
              >
                {alertesCount}
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (étudiant, matière)…"
            className="pl-8"
            aria-label="Rechercher une note"
          />
        </div>
        <Select value={matiere} onValueChange={setMatiere}>
          <SelectTrigger className="w-48" aria-label="Filtrer par matière">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les matières</SelectItem>
            {matieres.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select value={semestre} onValueChange={setSemestre}>
          <SelectTrigger className="w-36" aria-label="Filtrer par semestre">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous semestres</SelectItem>
            <SelectItem value="S1">Semestre 1</SelectItem>
            <SelectItem value="S2">Semestre 2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeEvaluation} onValueChange={setTypeEvaluation}>
          <SelectTrigger className="w-44" aria-label="Filtrer par type d'évaluation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes évaluations</SelectItem>
            <SelectItem value="CC">Contrôle continu</SelectItem>
            <SelectItem value="PROJET">Projet</SelectItem>
            <SelectItem value="EXAMEN_FINAL">Examen final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {gradesQuery.isError ? (
        <ErrorState error={gradesQuery.error} onRetry={() => void gradesQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(grade) => grade.id}
          isLoading={gradesQuery.isPending || studentsQuery.isPending}
          pageSize={12}
          emptyState={
            grades.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Aucune note"
                description="Saisissez une première note ; elle passera en validation avant publication."
                action={
                  <Button onClick={() => setFormOpen(true)}>
                    <ClipboardPlus /> Saisir une note
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucune note ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <GradeFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <GradeFormDialog
        open={editTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        grade={editTarget}
      />

      <ConfirmDialog
        open={validateTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setValidateTarget(undefined);
        }}
        title="Valider la note"
        description={
          validateTarget
            ? `Valider la note ${validateTarget.valeur}/${validateTarget.bareme} de ${
                studentById.get(validateTarget.student_id)?.name ?? "l'étudiant"
              } ? Elle pourra ensuite être publiée.`
            : undefined
        }
        confirmLabel="Valider"
        loading={validateGrade.isPending}
        onConfirm={() => {
          if (!validateTarget) return;
          validateGrade.mutate(
            { gradeId: validateTarget.id, statut: "VALIDE" },
            { onSuccess: () => setValidateTarget(undefined) },
          );
        }}
      />

      <ConfirmDialog
        open={rejectTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(undefined);
        }}
        title="Rejeter la note"
        description={
          rejectTarget
            ? `Rejeter la note ${rejectTarget.valeur}/${rejectTarget.bareme} de ${
                studentById.get(rejectTarget.student_id)?.name ?? "l'étudiant"
              } ? L'enseignant devra la corriger.`
            : undefined
        }
        confirmLabel="Rejeter"
        destructive
        loading={validateGrade.isPending}
        onConfirm={() => {
          if (!rejectTarget) return;
          validateGrade.mutate(
            { gradeId: rejectTarget.id, statut: "REJETE" },
            { onSuccess: () => setRejectTarget(undefined) },
          );
        }}
      />

      <ConfirmDialog
        open={publishTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setPublishTarget(undefined);
        }}
        title="Publier la note"
        description={
          publishTarget
            ? `Publier la note ${publishTarget.valeur}/${publishTarget.bareme} de ${
                studentById.get(publishTarget.student_id)?.name ?? "l'étudiant"
              } ? Elle deviendra visible dans son espace.`
            : undefined
        }
        confirmLabel="Publier"
        loading={publishGrade.isPending}
        onConfirm={() => {
          if (!publishTarget) return;
          publishGrade.mutate(publishTarget.id, {
            onSuccess: () => setPublishTarget(undefined),
          });
        }}
      />
    </div>
  );
}
