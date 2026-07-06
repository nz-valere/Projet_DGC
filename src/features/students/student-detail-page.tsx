import { ArrowLeft, CheckCircle2, Pencil, UserPlus, XCircle } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { EnumBadge } from "@/components/shared/status-badge";
import { STATUT_INSCRIPTION } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { CANAL_NOTIFICATION } from "@/lib/labels";
import { StudentBulletinTab } from "@/features/bulletins/bulletin-tab";
import { useClasses } from "@/features/classes/api";
import {
  useStudent,
  useStudentDocuments,
  useStudentParents,
  useValidateStudent,
} from "./api";
import { DocumentsList } from "./documents-list";
import { InscriptionTimeline } from "./inscription-timeline";
import { ParentFormDialog } from "./parent-form-dialog";
import { RejectStudentDialog } from "./reject-student-dialog";
import {
  StudentAttendanceTab,
  StudentDisciplinesTab,
  StudentGradesTab,
  StudentPaymentsTab,
} from "./student-detail-tabs";
import { StudentFormDialog } from "./student-form-dialog";

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-9 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const studentQuery = useStudent(studentId ?? "");
  const classesQuery = useClasses();
  const parentsQuery = useStudentParents(studentId ?? "");
  const documentsQuery = useStudentDocuments(studentId ?? "");
  const validateStudent = useValidateStudent();

  const [editOpen, setEditOpen] = React.useState(false);
  const [validateOpen, setValidateOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [parentOpen, setParentOpen] = React.useState(false);

  if (studentQuery.isPending) return <DetailSkeleton />;

  if (studentQuery.isError) {
    return (
      <ErrorState error={studentQuery.error} onRetry={() => void studentQuery.refetch()} />
    );
  }

  const student = studentQuery.data;
  const classeName =
    (classesQuery.data ?? []).find((c) => c.id === student.classe_id)?.nom ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/etudiants">
              <ArrowLeft /> Retour à la liste
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {student.nom.toUpperCase()} {student.prenom}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{student.matricule}</span>
            <EnumBadge map={STATUT_INSCRIPTION} value={student.statut} />
          </div>
        </div>
        <div className="flex gap-2">
          {student.statut === "EN_ATTENTE_VALIDATION" ? (
            <>
              <Button onClick={() => setValidateOpen(true)}>
                <CheckCircle2 /> Valider l'inscription
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle /> Rejeter
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Modifier
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pb-5 pt-6">
          <InscriptionTimeline statut={student.statut} />
          {student.statut === "EN_ATTENTE_VALIDATION" ? (
            <p className="mt-4 border-t pt-3 text-center text-sm text-muted-foreground">
              Contrôle du dossier —{" "}
              <span className="font-medium text-foreground">
                {documentsQuery.data?.length ?? 0} pièce
                {(documentsQuery.data?.length ?? 0) > 1 ? "s" : ""} déposée
                {(documentsQuery.data?.length ?? 0) > 1 ? "s" : ""}
              </span>{" "}
              ·{" "}
              <span className="font-medium text-foreground">
                {parentsQuery.data?.length ?? 0} parent
                {(parentsQuery.data?.length ?? 0) > 1 ? "s" : ""} enregistré
                {(parentsQuery.data?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dossier scolaire</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <InfoRow label="Filière" value={student.filiere} />
            <InfoRow label="Classe" value={classeName} />
            <InfoRow label="Année académique" value={student.annee_academique} />
            <InfoRow label="Inscrit le" value={formatDate(student.created_at)} />
          </dl>
          {student.notes_inscription ? (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes d'inscription
              </p>
              {student.notes_inscription}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Parents / tuteurs</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setParentOpen(true)}>
              <UserPlus /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {parentsQuery.isError ? (
              <ErrorState error={parentsQuery.error} onRetry={() => void parentsQuery.refetch()} />
            ) : parentsQuery.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : (parentsQuery.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun parent / tuteur enregistré.
              </p>
            ) : (
              <ul className="divide-y">
                {(parentsQuery.data ?? []).map((parent) => (
                  <li key={parent.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{parent.lien_parente}</p>
                      <p className="truncate text-xs text-muted-foreground">{parent.telephone}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {CANAL_NOTIFICATION[parent.preferences_notification]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pièces du dossier</CardTitle>
          </CardHeader>
          <CardContent>
            {documentsQuery.isError ? (
              <ErrorState
                error={documentsQuery.error}
                onRetry={() => void documentsQuery.refetch()}
              />
            ) : (
              <DocumentsList
                documents={documentsQuery.data ?? []}
                isLoading={documentsQuery.isPending}
                emptyLabel="L'étudiant n'a déposé aucune pièce."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="bulletin">Bulletin</TabsTrigger>
          <TabsTrigger value="presences">Présences</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <StudentGradesTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="bulletin">
          <StudentBulletinTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="presences">
          <StudentAttendanceTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="paiements">
          <StudentPaymentsTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="sanctions">
          <StudentDisciplinesTab studentId={student.id} />
        </TabsContent>
      </Tabs>

      <StudentFormDialog open={editOpen} onOpenChange={setEditOpen} student={student} />

      <RejectStudentDialog open={rejectOpen} onOpenChange={setRejectOpen} student={student} />

      <ParentFormDialog open={parentOpen} onOpenChange={setParentOpen} studentId={student.id} />

      <ConfirmDialog
        open={validateOpen}
        onOpenChange={setValidateOpen}
        title="Valider l'inscription"
        description={`Confirmer l'inscription définitive de ${student.prenom} ${student.nom} ?`}
        confirmLabel="Valider l'inscription"
        loading={validateStudent.isPending}
        onConfirm={() =>
          validateStudent.mutate(student.id, { onSuccess: () => setValidateOpen(false) })
        }
      />
    </div>
  );
}
