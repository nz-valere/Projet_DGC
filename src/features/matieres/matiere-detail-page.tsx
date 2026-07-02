import { ArrowLeft, BookOpen, Pencil, Users } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import type {
  ClasseResponse,
  GradeResponse,
  StudentResponse,
} from "@/api/types";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { EnumBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClasses } from "@/features/classes/api";
import { useGrades } from "@/features/grades/api";
import { useStudents } from "@/features/students/api";
import { useUsers } from "@/features/users/api";
import { STATUT_NOTE } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { useMatiere } from "./api";
import { MatiereEnseignantsDialog } from "./matiere-enseignants-dialog";
import { useMatiereRelations } from "./use-matiere-relations";

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-9 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function MatiereDetailPage() {
  const { matiereId } = useParams<{ matiereId: string }>();
  const id = matiereId ?? "";

  const matiereQuery = useMatiere(id);
  const relations = useMatiereRelations(id);
  const gradesQuery = useGrades();
  const studentsQuery = useStudents();
  const classesQuery = useClasses();
  const enseignantsQuery = useUsers("ENSEIGNANT");

  const [manageOpen, setManageOpen] = React.useState(false);

  const studentName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of studentsQuery.data ?? []) {
      map.set(s.id, `${s.nom.toUpperCase()} ${s.prenom}`);
    }
    return map;
  }, [studentsQuery.data]);

  const classeName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const enseignantEmail = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enseignantsQuery.data ?? []) map.set(e.id, e.email);
    for (const e of matiereQuery.data?.enseignants ?? []) map.set(e.id, e.email);
    return map;
  }, [enseignantsQuery.data, matiereQuery.data]);

  const matiereGrades = React.useMemo(
    () => (gradesQuery.data ?? []).filter((g) => g.matiere_id === id),
    [gradesQuery.data, id],
  );

  // Dernière note par étudiant pour cette matière.
  const latestGradeByStudent = React.useMemo(() => {
    const map = new Map<string, GradeResponse>();
    for (const grade of matiereGrades) {
      const current = map.get(grade.student_id);
      if (!current || grade.created_at > current.created_at) map.set(grade.student_id, grade);
    }
    return map;
  }, [matiereGrades]);

  const moyenne = React.useMemo(() => {
    if (matiereGrades.length === 0) return null;
    const total = matiereGrades.reduce(
      (sum, g) => sum + (g.bareme ? (g.valeur / g.bareme) * 20 : 0),
      0,
    );
    return total / matiereGrades.length;
  }, [matiereGrades]);

  if (matiereQuery.isPending) return <DetailSkeleton />;
  if (matiereQuery.isError) {
    return <ErrorState error={matiereQuery.error} onRetry={() => void matiereQuery.refetch()} />;
  }

  const matiere = matiereQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/matieres">
              <ArrowLeft /> Retour au catalogue
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-brand/30 bg-accent font-mono text-xs text-accent-foreground"
            >
              {matiere.code}
            </Badge>
            {matiere.filiere ? (
              <span className="text-sm text-muted-foreground">{matiere.filiere}</span>
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{matiere.nom}</h1>
          {matiere.description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{matiere.description}</p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => setManageOpen(true)}>
          <Users /> Gérer les enseignants
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Coefficient" value={matiere.coefficient} />
        <Stat label="Enseignants" value={matiere.enseignants.length} />
        <Stat
          label="Classes"
          value={relations.isLoading ? "…" : relations.teachingClasses.length}
          sub="où enseignée"
        />
        <Stat
          label="Étudiants"
          value={relations.isLoading ? "…" : relations.students.length}
          sub="concernés"
        />
        <Stat
          label="Moyenne"
          value={moyenne === null ? "—" : `${moyenne.toFixed(1)}/20`}
          sub={`${matiereGrades.length} note${matiereGrades.length > 1 ? "s" : ""}`}
        />
      </div>

      <Tabs defaultValue="etudiants">
        <TabsList>
          <TabsTrigger value="etudiants">Étudiants</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="enseignants">Enseignants</TabsTrigger>
        </TabsList>

        <TabsContent value="etudiants">
          <StudentsTab
            students={relations.students}
            classeName={classeName}
            latestGradeByStudent={latestGradeByStudent}
            isLoading={relations.isLoading}
          />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab
            grades={matiereGrades}
            studentName={studentName}
            enseignantEmail={enseignantEmail}
            isLoading={gradesQuery.isPending}
          />
        </TabsContent>

        <TabsContent value="classes">
          <ClassesTab classes={relations.teachingClasses} isLoading={relations.isLoading} />
        </TabsContent>

        <TabsContent value="enseignants">
          <EnseignantsTab matiere={matiere} onManage={() => setManageOpen(true)} />
        </TabsContent>
      </Tabs>

      <MatiereEnseignantsDialog open={manageOpen} onOpenChange={setManageOpen} matiere={matiere} />
    </div>
  );
}

function StudentsTab({
  students,
  classeName,
  latestGradeByStudent,
  isLoading,
}: {
  students: StudentResponse[];
  classeName: Map<string, string>;
  latestGradeByStudent: Map<string, GradeResponse>;
  isLoading: boolean;
}) {
  const columns: DataTableColumn<StudentResponse>[] = [
    {
      id: "nom",
      header: "Étudiant",
      cell: (s) => (
        <span className="font-medium">
          {s.nom.toUpperCase()} {s.prenom}
        </span>
      ),
      sortValue: (s) => `${s.nom} ${s.prenom}`,
    },
    {
      id: "classe",
      header: "Classe",
      cell: (s) => (s.classe_id ? (classeName.get(s.classe_id) ?? "—") : "—"),
      sortValue: (s) => (s.classe_id ? (classeName.get(s.classe_id) ?? "") : ""),
    },
    {
      id: "filiere",
      header: "Filière",
      cell: (s) => s.filiere,
      sortValue: (s) => s.filiere,
    },
    {
      id: "note",
      header: "Dernière note",
      cell: (s) => {
        const grade = latestGradeByStudent.get(s.id);
        return grade ? (
          <span className="tabular-nums font-medium">
            {grade.valeur}/{grade.bareme}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      sortValue: (s) => {
        const grade = latestGradeByStudent.get(s.id);
        return grade ? grade.valeur / (grade.bareme || 1) : -1;
      },
    },
  ];

  return (
    <DataTable
      data={students}
      columns={columns}
      getRowId={(s) => s.id}
      isLoading={isLoading}
      emptyState={
        <EmptyState
          icon={Users}
          title="Aucun étudiant"
          description="Affectez cette matière à une classe pour y rattacher des étudiants."
        />
      }
    />
  );
}

function NotesTab({
  grades,
  studentName,
  enseignantEmail,
  isLoading,
}: {
  grades: GradeResponse[];
  studentName: Map<string, string>;
  enseignantEmail: Map<string, string>;
  isLoading: boolean;
}) {
  const columns: DataTableColumn<GradeResponse>[] = [
    {
      id: "etudiant",
      header: "Étudiant",
      cell: (g) => studentName.get(g.student_id) ?? g.student_id,
      sortValue: (g) => studentName.get(g.student_id) ?? "",
    },
    {
      id: "note",
      header: "Note",
      cell: (g) => (
        <span className="tabular-nums font-medium">
          {g.valeur} / {g.bareme}
        </span>
      ),
      sortValue: (g) => g.valeur / (g.bareme || 1),
    },
    {
      id: "statut",
      header: "Statut",
      cell: (g) => <EnumBadge map={STATUT_NOTE} value={g.statut} />,
      sortValue: (g) => g.statut,
    },
    {
      id: "enseignant",
      header: "Enseignant",
      cell: (g) => enseignantEmail.get(g.enseignant_id) ?? "—",
      sortValue: (g) => enseignantEmail.get(g.enseignant_id) ?? "",
    },
    {
      id: "date",
      header: "Saisie le",
      cell: (g) => formatDate(g.created_at),
      sortValue: (g) => g.created_at,
    },
  ];

  return (
    <DataTable
      data={grades}
      columns={columns}
      getRowId={(g) => g.id}
      isLoading={isLoading}
      emptyState={
        <EmptyState
          icon={BookOpen}
          title="Aucune note"
          description="Aucune note n'a encore été saisie pour cette matière."
        />
      }
    />
  );
}

function ClassesTab({ classes, isLoading }: { classes: ClasseResponse[]; isLoading: boolean }) {
  const columns: DataTableColumn<ClasseResponse>[] = [
    {
      id: "nom",
      header: "Classe",
      cell: (c) => <span className="font-medium">{c.nom}</span>,
      sortValue: (c) => c.nom,
    },
    { id: "filiere", header: "Filière", cell: (c) => c.filiere, sortValue: (c) => c.filiere },
    { id: "niveau", header: "Niveau", cell: (c) => c.niveau ?? "—", sortValue: (c) => c.niveau ?? "" },
  ];

  return (
    <DataTable
      data={classes}
      columns={columns}
      getRowId={(c) => c.id}
      isLoading={isLoading}
      emptyState={
        <EmptyState
          icon={BookOpen}
          title="Aucune classe"
          description="Cette matière n'est affectée à aucune classe pour l'instant."
        />
      }
    />
  );
}

function EnseignantsTab({
  matiere,
  onManage,
}: {
  matiere: { enseignants: { id: string; email: string; matricule: string | null }[] };
  onManage: () => void;
}) {
  if (matiere.enseignants.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun enseignant"
        description="Affectez un ou plusieurs enseignants à cette matière."
        action={
          <Button onClick={onManage}>
            <Pencil /> Gérer les enseignants
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {matiere.enseignants.map((enseignant) => (
        <Card key={enseignant.id} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {enseignant.email.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{enseignant.email}</p>
            {enseignant.matricule ? (
              <p className="font-mono text-xs text-muted-foreground">{enseignant.matricule}</p>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
