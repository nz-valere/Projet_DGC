import { Award } from "lucide-react";
import * as React from "react";
import type { Semestre } from "@/api/types";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { academicYearOptions } from "@/lib/utils";
import { useMyBulletin, useStudentBulletin } from "./api";
import { BulletinDocument } from "./bulletin-document";

/** Année « promotion de l'étudiant » : on laisse le backend choisir par défaut. */
const DEFAULT_YEAR = "__default__";

interface PeriodPickerProps {
  semestre: Semestre;
  onSemestre: (s: Semestre) => void;
  annee: string;
  onAnnee: (a: string) => void;
}

function PeriodPicker({ semestre, onSemestre, annee, onAnnee }: PeriodPickerProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select value={semestre} onValueChange={(value) => onSemestre(value as Semestre)}>
        <SelectTrigger className="w-40" aria-label="Semestre">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="S1">Semestre 1</SelectItem>
          <SelectItem value="S2">Semestre 2</SelectItem>
        </SelectContent>
      </Select>
      <Select value={annee} onValueChange={onAnnee}>
        <SelectTrigger className="w-44" aria-label="Année académique">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_YEAR}>Année de promotion</SelectItem>
          {academicYearOptions().map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface BulletinQueryLike {
  data?: import("@/api/types").BulletinResponse;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

function BulletinTabContent({ query }: { query: BulletinQueryLike }) {
  if (query.isPending) {
    return <Skeleton className="h-96 w-full" aria-busy="true" />;
  }
  if (query.isError) {
    // 400/404 : pas de classe, pas d'étudiant lié… — cas « pas de bulletin », pas une panne.
    const error = query.error;
    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
      return <EmptyState icon={Award} title="Pas de bulletin" description={error.message} />;
    }
    return <ErrorState error={error} onRetry={() => void query.refetch()} />;
  }
  return query.data ? <BulletinDocument bulletin={query.data} /> : null;
}

/** Onglet « Bulletin » de la fiche étudiant (accès staff). */
export function StudentBulletinTab({ studentId }: { studentId: string }) {
  const [semestre, setSemestre] = React.useState<Semestre>("S1");
  const [annee, setAnnee] = React.useState(DEFAULT_YEAR);
  const query = useStudentBulletin(studentId, semestre, annee === DEFAULT_YEAR ? null : annee);

  return (
    <div>
      <PeriodPicker semestre={semestre} onSemestre={setSemestre} annee={annee} onAnnee={setAnnee} />
      <BulletinTabContent query={query} />
    </div>
  );
}

/** Onglet « Bulletin » de Mon espace (étudiant connecté ou parent). */
export function MyBulletinTab() {
  const [semestre, setSemestre] = React.useState<Semestre>("S1");
  const [annee, setAnnee] = React.useState(DEFAULT_YEAR);
  const query = useMyBulletin(semestre, annee === DEFAULT_YEAR ? null : annee);

  return (
    <div>
      <PeriodPicker semestre={semestre} onSemestre={setSemestre} annee={annee} onAnnee={setAnnee} />
      <BulletinTabContent query={query} />
    </div>
  );
}
