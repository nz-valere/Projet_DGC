import { CalendarCheck, ClipboardList, CreditCard, Gavel, TriangleAlert } from "lucide-react";
import * as React from "react";
import type {
  AttendanceResponse,
  DisciplineResponse,
  GradeResponse,
  PaymentResponse,
} from "@/api/types";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { EnumBadge } from "@/components/shared/status-badge";
import {
  GRAVITE_SANCTION,
  MODE_PAIEMENT,
  STATUT_NOTE,
  STATUT_PAIEMENT,
  STATUT_PRESENCE,
  STATUT_VALIDATION,
  TYPE_EVALUATION,
} from "@/lib/labels";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { useMatieres } from "@/features/matieres/api";
import {
  useStudentAttendance,
  useStudentDisciplines,
  useStudentGrades,
  useStudentPayments,
} from "./api";

/** Forme minimale d'un résultat react-query de liste — partagée fiche staff / portail étudiant. */
export interface ListQuery<T> {
  data?: T[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

export function GradesTable({ query }: { query: ListQuery<GradeResponse> }) {
  const matieresQuery = useMatieres();

  const matiereNames = React.useMemo(() => {
    const names = new Map<string, string>();
    for (const matiere of matieresQuery.data ?? []) {
      names.set(matiere.id, `${matiere.nom} (${matiere.code})`);
    }
    return names;
  }, [matieresQuery.data]);

  const columns: DataTableColumn<GradeResponse>[] = [
    {
      id: "matiere",
      header: "Matière",
      cell: (grade) => matiereNames.get(grade.matiere_id) ?? grade.matiere_id,
      sortValue: (grade) => matiereNames.get(grade.matiere_id) ?? grade.matiere_id,
    },
    {
      id: "note",
      header: "Note",
      cell: (grade) => (
        <span className="font-medium tabular-nums">
          {grade.valeur} / {grade.bareme}
          {grade.alerte ? (
            <span title={grade.alerte} className="ml-1.5 inline-flex align-middle">
              <TriangleAlert
                className="h-4 w-4 text-amber-600"
                aria-label={`Alerte : ${grade.alerte}`}
              />
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
      hideBelow: "md",
    },
    {
      id: "appreciation",
      header: "Appréciation",
      cell: (grade) => grade.appreciation ?? "—",
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
      hideBelow: "md",
    },
  ];

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <DataTable
      data={query.data ?? []}
      columns={columns}
      getRowId={(grade) => grade.id}
      isLoading={query.isPending}
      emptyState={
        <EmptyState
          icon={ClipboardList}
          title="Aucune note"
          description="Aucune note n'a encore été saisie."
        />
      }
    />
  );
}

export function AttendanceTable({ query }: { query: ListQuery<AttendanceResponse> }) {
  const columns: DataTableColumn<AttendanceResponse>[] = [
    {
      id: "date",
      header: "Date",
      cell: (attendance) => formatDate(attendance.date),
      sortValue: (attendance) => attendance.date,
    },
    {
      id: "seance",
      header: "Séance",
      cell: (attendance) => <span className="font-mono text-xs">{attendance.seance_id}</span>,
      hideBelow: "lg",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (attendance) => <EnumBadge map={STATUT_PRESENCE} value={attendance.statut} />,
      sortValue: (attendance) => attendance.statut,
    },
    {
      id: "motif",
      header: "Motif",
      cell: (attendance) => attendance.motif ?? "—",
      hideBelow: "md",
    },
    {
      id: "correction",
      header: "Correction",
      hideBelow: "lg",
      cell: (attendance) =>
        attendance.motif_correction ? (
          <span className="text-xs text-muted-foreground">
            {attendance.motif_correction}
            {attendance.corrige_le ? ` (${formatDateTime(attendance.corrige_le)})` : ""}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <DataTable
      data={query.data ?? []}
      columns={columns}
      getRowId={(attendance) => attendance.id}
      isLoading={query.isPending}
      emptyState={
        <EmptyState
          icon={CalendarCheck}
          title="Aucune présence enregistrée"
          description="Aucun relevé de présence."
        />
      }
    />
  );
}

export function PaymentsTable({ query }: { query: ListQuery<PaymentResponse> }) {
  const columns: DataTableColumn<PaymentResponse>[] = [
    {
      id: "recu",
      header: "Reçu n°",
      cell: (payment) => <span className="font-mono text-xs">{payment.numero_recu}</span>,
      sortValue: (payment) => payment.numero_recu,
      hideBelow: "md",
    },
    {
      id: "montant",
      header: "Montant",
      cell: (payment) => <span className="tabular-nums">{formatMoney(payment.montant)}</span>,
      sortValue: (payment) => payment.montant,
    },
    {
      id: "attendu",
      header: "Attendu",
      cell: (payment) => (
        <span className="tabular-nums text-muted-foreground">
          {formatMoney(payment.montant_attendu)}
        </span>
      ),
      sortValue: (payment) => payment.montant_attendu,
      hideBelow: "lg",
    },
    {
      id: "mode",
      header: "Mode",
      cell: (payment) => MODE_PAIEMENT[payment.mode_paiement],
      hideBelow: "md",
    },
    {
      id: "statut",
      header: "Statut",
      cell: (payment) => <EnumBadge map={STATUT_PAIEMENT} value={payment.statut} />,
      sortValue: (payment) => payment.statut,
    },
    {
      id: "date",
      header: "Date",
      cell: (payment) => formatDate(payment.created_at),
      sortValue: (payment) => payment.created_at,
    },
  ];

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <DataTable
      data={query.data ?? []}
      columns={columns}
      getRowId={(payment) => payment.id}
      isLoading={query.isPending}
      emptyState={
        <EmptyState
          icon={CreditCard}
          title="Aucun paiement"
          description="Aucun encaissement enregistré."
        />
      }
    />
  );
}

export function DisciplinesTable({ query }: { query: ListQuery<DisciplineResponse> }) {
  const columns: DataTableColumn<DisciplineResponse>[] = [
    {
      id: "nature",
      header: "Nature",
      cell: (discipline) => <span className="font-medium">{discipline.nature}</span>,
      sortValue: (discipline) => discipline.nature,
    },
    {
      id: "gravite",
      header: "Gravité",
      cell: (discipline) => <EnumBadge map={GRAVITE_SANCTION} value={discipline.gravite} />,
      sortValue: (discipline) => discipline.gravite,
    },
    {
      id: "sanction",
      header: "Sanction",
      cell: (discipline) => discipline.sanction ?? "—",
      hideBelow: "md",
    },
    {
      id: "validation",
      header: "Validation",
      cell: (discipline) => (
        <EnumBadge map={STATUT_VALIDATION} value={discipline.statut_validation} />
      ),
      sortValue: (discipline) => discipline.statut_validation,
    },
    {
      id: "date",
      header: "Date",
      cell: (discipline) => formatDate(discipline.created_at),
      sortValue: (discipline) => discipline.created_at,
      hideBelow: "md",
    },
  ];

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <DataTable
      data={query.data ?? []}
      columns={columns}
      getRowId={(discipline) => discipline.id}
      isLoading={query.isPending}
      emptyState={
        <EmptyState
          icon={Gavel}
          title="Aucune sanction"
          description="Aucun dossier disciplinaire."
        />
      }
    />
  );
}

/* Wrappers « fiche étudiant » côté staff : récupèrent par studentId puis délèguent. */

export function StudentGradesTab({ studentId }: { studentId: string }) {
  return <GradesTable query={useStudentGrades(studentId)} />;
}

export function StudentAttendanceTab({ studentId }: { studentId: string }) {
  return <AttendanceTable query={useStudentAttendance(studentId)} />;
}

export function StudentPaymentsTab({ studentId }: { studentId: string }) {
  return <PaymentsTable query={useStudentPayments(studentId)} />;
}

export function StudentDisciplinesTab({ studentId }: { studentId: string }) {
  return <DisciplinesTable query={useStudentDisciplines(studentId)} />;
}
