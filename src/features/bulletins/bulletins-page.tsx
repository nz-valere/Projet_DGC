import { Award, ChevronRight, Medal, School } from "lucide-react";
import * as React from "react";
import type { BulletinResponse, Semestre } from "@/api/types";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClasses } from "@/features/classes/api";
import { mentionFromMoyenne } from "@/lib/labels";
import { academicYearOptions, cn, currentAcademicYear } from "@/lib/utils";
import { useClasseBulletins } from "./api";
import { BulletinDocument } from "./bulletin-document";

/** Couleur des médailles du podium (rangs 1 à 3). */
const MEDALS = ["text-amber-500", "text-zinc-400", "text-orange-700"] as const;

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function BulletinsPage() {
  const classesQuery = useClasses();
  const classes = classesQuery.data ?? [];

  const [classeId, setClasseId] = React.useState("");
  const [annee, setAnnee] = React.useState(currentAcademicYear());
  const [semestre, setSemestre] = React.useState<Semestre>("S1");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const bulletinsQuery = useClasseBulletins(classeId, annee, semestre);
  const bulletins = React.useMemo(() => bulletinsQuery.data ?? [], [bulletinsQuery.data]);

  // Changement de période ou de classe : on replie le bulletin ouvert.
  React.useEffect(() => {
    setSelectedId(null);
  }, [classeId, annee, semestre]);

  const stats = React.useMemo(() => {
    if (bulletins.length === 0) return null;
    const moyennes = bulletins.map((b) => b.moyenne_generale);
    const somme = moyennes.reduce((acc, m) => acc + m, 0);
    const admis = moyennes.filter((m) => m >= 10).length;
    return {
      moyenneClasse: somme / bulletins.length,
      meilleure: Math.max(...moyennes),
      tauxReussite: (admis / bulletins.length) * 100,
      admis,
    };
  }, [bulletins]);

  /** Rangs partagés (ex æquo) pour les signaler dans le palmarès. */
  const rangCounts = React.useMemo(() => {
    const counts = new Map<number, number>();
    for (const b of bulletins) counts.set(b.rang, (counts.get(b.rang) ?? 0) + 1);
    return counts;
  }, [bulletins]);

  const selected: BulletinResponse | undefined = bulletins.find(
    (b) => b.student_id === selectedId,
  );

  return (
    <div>
      <PageHeader
        title="Bulletins"
        description="Moyennes pondérées et classement par classe — notes publiées uniquement."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={classeId} onValueChange={setClasseId} disabled={classesQuery.isPending}>
          <SelectTrigger className="w-60" aria-label="Classe">
            <SelectValue placeholder="Sélectionner une classe" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((classe) => (
              <SelectItem key={classe.id} value={classe.id}>
                {classe.nom} — {classe.filiere || "—"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={annee} onValueChange={setAnnee}>
          <SelectTrigger className="w-36" aria-label="Année académique">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {academicYearOptions().map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Bascule S1 / S2 */}
        <div
          className="inline-flex overflow-hidden rounded-md border"
          role="group"
          aria-label="Semestre"
        >
          {(["S1", "S2"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemestre(s)}
              aria-pressed={semestre === s}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                semestre === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {classeId === "" ? (
        <EmptyState
          icon={School}
          title="Choisissez une classe"
          description="Sélectionnez une classe, une année académique et un semestre pour générer les bulletins."
        />
      ) : bulletinsQuery.isError ? (
        <ErrorState
          error={bulletinsQuery.error}
          onRetry={() => void bulletinsQuery.refetch()}
        />
      ) : bulletinsQuery.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : bulletins.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Aucun bulletin"
          description="Aucun étudiant inscrit classé pour cette période — vérifiez la classe, l'année et le semestre."
        />
      ) : (
        <div className="space-y-6">
          {stats ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Moyenne de classe"
                value={`${stats.moyenneClasse.toFixed(2)} / 20`}
                hint={`${bulletins.length} étudiants classés`}
              />
              <StatCard
                label="Meilleure moyenne"
                value={`${stats.meilleure.toFixed(2)} / 20`}
                hint={mentionFromMoyenne(stats.meilleure)}
              />
              <StatCard
                label="Taux de réussite"
                value={`${stats.tauxReussite.toFixed(0)} %`}
                hint={`${stats.admis} moyenne${stats.admis > 1 ? "s" : ""} ≥ 10`}
              />
            </div>
          ) : null}

          {/* Palmarès de la classe */}
          <div className="overflow-hidden rounded-lg border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rang</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead className="hidden sm:table-cell">Matricule</TableHead>
                  <TableHead className="w-56">Moyenne générale</TableHead>
                  <TableHead className="hidden md:table-cell">Mention</TableHead>
                  <TableHead className="w-10" aria-label="Ouvrir le bulletin" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulletins.map((bulletin) => {
                  const exAequo = (rangCounts.get(bulletin.rang) ?? 0) > 1;
                  const isSelected = bulletin.student_id === selectedId;
                  return (
                    <TableRow
                      key={bulletin.student_id}
                      onClick={() =>
                        setSelectedId(isSelected ? null : bulletin.student_id)
                      }
                      aria-selected={isSelected}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-accent hover:bg-accent",
                      )}
                    >
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                          {bulletin.rang <= 3 ? (
                            <Medal
                              className={cn("h-4 w-4", MEDALS[bulletin.rang - 1])}
                              aria-hidden
                            />
                          ) : null}
                          {bulletin.rang}
                          {exAequo ? (
                            <span className="text-[0.6rem] font-medium uppercase text-muted-foreground">
                              ex æquo
                            </span>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {bulletin.nom.toUpperCase()} {bulletin.prenom}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {bulletin.matricule}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-14 shrink-0 text-right font-semibold tabular-nums",
                              bulletin.moyenne_generale < 10 && "text-destructive",
                            )}
                          >
                            {bulletin.moyenne_generale.toFixed(2)}
                          </span>
                          <span
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                            aria-hidden
                          >
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                bulletin.moyenne_generale >= 10 ? "bg-primary" : "bg-destructive",
                              )}
                              style={{
                                width: `${Math.min(100, (bulletin.moyenne_generale / 20) * 100)}%`,
                              }}
                            />
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {mentionFromMoyenne(bulletin.moyenne_generale)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isSelected && "rotate-90",
                          )}
                          aria-hidden
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {selected ? (
            <div className="animate-rise-in">
              <BulletinDocument bulletin={selected} />
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Cliquez sur un étudiant pour afficher son bulletin détaillé et l'imprimer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
