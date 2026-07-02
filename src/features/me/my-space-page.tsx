import { Loader2, Upload } from "lucide-react";
import * as React from "react";
import type { TypeDocument } from "@/api/types";
import { extractErrorMessage } from "@/api/client";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { EnumBadge } from "@/components/shared/status-badge";
import { STATUT_INSCRIPTION, TYPE_DOCUMENT } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsList } from "@/features/students/documents-list";
import { InscriptionTimeline } from "@/features/students/inscription-timeline";
import {
  AttendanceTable,
  DisciplinesTable,
  GradesTable,
  PaymentsTable,
} from "@/features/students/student-detail-tabs";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  useMyAttendance,
  useMyDisciplines,
  useMyDocuments,
  useMyGrades,
  useMyPayments,
  useMyProfile,
  useUploadMyDocument,
} from "./api";

function MyDocumentsCard() {
  const documentsQuery = useMyDocuments();
  const upload = useUploadMyDocument();
  const [type, setType] = React.useState<TypeDocument>("PHOTO");
  const [file, setFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onUpload = async () => {
    if (!file) return;
    try {
      await upload.mutateAsync({ typeDocument: type, file });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de l'envoi du document."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mes pièces justificatives</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Type de pièce</Label>
            <Select value={type} onValueChange={(value) => setType(value as TypeDocument)}>
              <SelectTrigger id="doc-type" className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_DOCUMENT).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            ref={inputRef}
            type="file"
            className="sm:flex-1"
            aria-label="Fichier à envoyer"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button onClick={onUpload} disabled={!file || upload.isPending}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            Envoyer
          </Button>
        </div>
        <Separator />
        {documentsQuery.isError ? (
          <ErrorState error={documentsQuery.error} onRetry={() => void documentsQuery.refetch()} />
        ) : (
          <DocumentsList
            documents={documentsQuery.data ?? []}
            isLoading={documentsQuery.isPending}
            emptyLabel="Vous n'avez encore déposé aucune pièce."
          />
        )}
      </CardContent>
    </Card>
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

export function MySpacePage() {
  const profileQuery = useMyProfile();
  const gradesQuery = useMyGrades();
  const attendanceQuery = useMyAttendance();
  const paymentsQuery = useMyPayments();
  const disciplinesQuery = useMyDisciplines();

  if (profileQuery.isError) {
    return <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} />;
  }

  const student = profileQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon espace"
        description="Vos notes, présences, paiements et dossier disciplinaire."
      />

      {student && student.statut !== "INSCRIT" ? (
        <div
          role="status"
          className={
            student.statut === "REJETE"
              ? "rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              : "rounded-lg border border-brand/30 bg-accent px-4 py-3 text-sm text-accent-foreground"
          }
        >
          {student.statut === "REJETE"
            ? "Votre demande d'inscription a été rejetée. Rapprochez-vous du secrétariat pour plus de détails."
            : "Votre inscription est en cours de traitement — déposez vos pièces justificatives ci-dessous pour accélérer la validation par le secrétariat."}
        </div>
      ) : null}

      {student ? (
        <Card>
          <CardContent className="pb-5 pt-6">
            <InscriptionTimeline statut={student.statut} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mon dossier</CardTitle>
        </CardHeader>
        <CardContent>
          {profileQuery.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : student ? (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoRow
                label="Identité"
                value={`${student.nom.toUpperCase()} ${student.prenom}`}
              />
              <InfoRow
                label="Matricule"
                value={<span className="font-mono text-xs">{student.matricule}</span>}
              />
              <InfoRow label="Filière" value={student.filiere} />
              <InfoRow label="Année académique" value={student.annee_academique} />
              <InfoRow label="Inscrit le" value={formatDate(student.created_at)} />
              <InfoRow
                label="Statut"
                value={<EnumBadge map={STATUT_INSCRIPTION} value={student.statut} />}
              />
            </dl>
          ) : null}
        </CardContent>
      </Card>

      <MyDocumentsCard />

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="presences">Présences</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <GradesTable query={gradesQuery} />
        </TabsContent>
        <TabsContent value="presences">
          <AttendanceTable query={attendanceQuery} />
        </TabsContent>
        <TabsContent value="paiements">
          <PaymentsTable query={paymentsQuery} />
        </TabsContent>
        <TabsContent value="sanctions">
          <DisciplinesTable query={disciplinesQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
