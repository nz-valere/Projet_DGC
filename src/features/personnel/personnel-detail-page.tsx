import { ArrowLeft, ArrowRight, BookOpen, Pencil, Power, PowerOff } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { EnumBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClasses } from "@/features/classes/api";
import { useGrades } from "@/features/grades/api";
import { useMatieresByEnseignant } from "@/features/matieres/api";
import { useOnlinePresence } from "@/features/presence/api";
import { useSeances } from "@/features/seances/api";
import { useSetUserActive, useUser } from "@/features/users/api";
import { STATUT_NOTE } from "@/lib/labels";
import { cn, formatDate, formatDateTime, formatRelativeTime, todayISODate } from "@/lib/utils";
import { PersonnelFormDialog } from "./personnel-form-dialog";
import { ActiveBadge, RoleBadge } from "./role-badge";

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

/**
 * Activité du compte : connexion en cours, dernière connexion et dernière
 * activité (champs exposés par /users). Le module est réservé à DIRECTION/ADMIN,
 * donc /presence/online est autorisé ici.
 */
function AccountActivityCard({
  userId,
  derniereConnexion,
  derniereActivite,
}: {
  userId: string;
  derniereConnexion: string | null | undefined;
  derniereActivite: string | null | undefined;
}) {
  const presenceQuery = useOnlinePresence();
  const online = (presenceQuery.data?.utilisateurs ?? []).some((u) => u.id === userId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activité du compte</CardTitle>
        <CardDescription>
          Connexions et présence — mis à jour en continu
          {presenceQuery.data ? ` (fenêtre de ${presenceQuery.data.fenetre_minutes} min)` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Statut</dt>
            <dd className="mt-1 text-sm font-medium">
              {online ? (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  En ligne
                </span>
              ) : (
                <span className="text-muted-foreground">Hors ligne</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Dernière connexion
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {derniereConnexion ? formatDateTime(derniereConnexion) : "Jamais connecté"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Dernière activité
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {derniereActivite ? (
                <span title={formatDateTime(derniereActivite)}>
                  {formatRelativeTime(derniereActivite)}
                </span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

/** Empreinte pédagogique d'un enseignant : matières, prochaines séances, notes. */
function EnseignantFootprint({ enseignantId }: { enseignantId: string }) {
  const matieresQuery = useMatieresByEnseignant(enseignantId);
  const seancesQuery = useSeances();
  const gradesQuery = useGrades();
  const classesQuery = useClasses();

  const classeName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const matiereName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matieresQuery.data ?? []) map.set(m.id, m.nom);
    return map;
  }, [matieresQuery.data]);

  const today = todayISODate();

  const upcoming = React.useMemo(
    () =>
      (seancesQuery.data ?? [])
        .filter((s) => s.enseignant_id === enseignantId && s.date >= today)
        .sort((a, b) =>
          a.date === b.date ? a.heure_debut.localeCompare(b.heure_debut) : a.date.localeCompare(b.date),
        )
        .slice(0, 5),
    [seancesQuery.data, enseignantId, today],
  );

  const grades = React.useMemo(
    () => (gradesQuery.data ?? []).filter((g) => g.enseignant_id === enseignantId),
    [gradesQuery.data, enseignantId],
  );

  const gradeCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of grades) counts.set(g.statut, (counts.get(g.statut) ?? 0) + 1);
    return counts;
  }, [grades]);

  const matieres = matieresQuery.data ?? [];
  const pendingGrades = (gradeCounts.get("EN_ATTENTE") ?? 0) + (gradeCounts.get("REJETE") ?? 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Matières" value={matieresQuery.isPending ? "…" : matieres.length} sub="assurées" />
        <Stat
          label="Séances à venir"
          value={seancesQuery.isPending ? "…" : upcoming.length}
          sub="planning"
        />
        <Stat
          label="Notes à traiter"
          value={gradesQuery.isPending ? "…" : pendingGrades}
          sub="en attente / rejetées"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Matières enseignées</CardTitle>
          </CardHeader>
          <CardContent>
            {matieresQuery.isError ? (
              <ErrorState
                error={matieresQuery.error}
                onRetry={() => void matieresQuery.refetch()}
              />
            ) : matieresQuery.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : matieres.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune matière affectée — gérez-les depuis le catalogue « Matières ».
              </p>
            ) : (
              <ul className="space-y-2">
                {matieres.map((matiere) => (
                  <li key={matiere.id}>
                    <Link
                      to={`/matieres/${matiere.id}`}
                      className="group flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:border-brand/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{matiere.nom}</span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {matiere.code} · coef. {matiere.coefficient}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prochaines séances</CardTitle>
              <CardDescription>
                {upcoming.length === 0 ? "Rien au planning." : "Les 5 prochaines au planning."}
              </CardDescription>
            </CardHeader>
            {upcoming.length > 0 ? (
              <CardContent>
                <ol className="relative space-y-3 border-l pl-4">
                  {upcoming.map((seance) => (
                    <li key={seance.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                          seance.date === today ? "bg-brand ring-4 ring-brand/20" : "bg-primary/50",
                        )}
                      />
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatDate(seance.date)} · {seance.heure_debut.slice(0, 5)}–
                        {seance.heure_fin.slice(0, 5)}
                      </p>
                      <p className="text-sm font-medium">
                        {matiereName.get(seance.matiere_id) ?? "Matière"}
                        <span className="text-muted-foreground">
                          {" "}
                          — {classeName.get(seance.classe_id) ?? "—"}
                        </span>
                        {seance.salle ? (
                          <span className="text-muted-foreground"> · salle {seance.salle}</span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes saisies</CardTitle>
              <CardDescription>
                {grades.length} note{grades.length > 1 ? "s" : ""} au total.
              </CardDescription>
            </CardHeader>
            {grades.length > 0 ? (
              <CardContent className="flex flex-wrap gap-2">
                {(Object.keys(STATUT_NOTE) as (keyof typeof STATUT_NOTE)[]).map((statut) => {
                  const count = gradeCounts.get(statut) ?? 0;
                  if (count === 0) return null;
                  return (
                    <span key={statut} className="inline-flex items-center gap-1.5">
                      <EnumBadge map={STATUT_NOTE} value={statut} />
                      <span className="text-sm font-medium tabular-nums">{count}</span>
                    </span>
                  );
                })}
              </CardContent>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

export function PersonnelDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const userQuery = useUser(userId ?? "");
  const setActive = useSetUserActive();

  const [editOpen, setEditOpen] = React.useState(false);
  const [toggleOpen, setToggleOpen] = React.useState(false);

  if (userQuery.isPending) return <DetailSkeleton />;
  if (userQuery.isError) {
    return <ErrorState error={userQuery.error} onRetry={() => void userQuery.refetch()} />;
  }

  const user = userQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/personnel">
              <ArrowLeft /> Retour à l'équipe
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-lg font-semibold uppercase text-accent-foreground">
              {user.email.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
                {user.email.split("@")[0]}
              </h1>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <RoleBadge role={user.role} />
            <ActiveBadge active={user.is_active} />
            {user.matricule ? (
              <Badge variant="outline" className="font-mono text-xs">
                {user.matricule}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              Membre depuis le {formatDate(user.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Modifier
          </Button>
          {user.is_active ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setToggleOpen(true)}
            >
              <PowerOff /> Désactiver
            </Button>
          ) : (
            <Button onClick={() => setToggleOpen(true)}>
              <Power /> Réactiver
            </Button>
          )}
        </div>
      </div>

      {!user.is_active ? (
        <div
          role="status"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Compte désactivé : ce membre ne peut plus se connecter. Son historique est conservé.
        </div>
      ) : null}

      <AccountActivityCard
        userId={user.id}
        derniereConnexion={user.derniere_connexion}
        derniereActivite={user.derniere_activite}
      />

      {user.role === "ENSEIGNANT" ? (
        <EnseignantFootprint enseignantId={user.id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compte administratif</CardTitle>
            <CardDescription>
              Ce rôle n'a pas d'activité pédagogique rattachée (matières, séances, notes).
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <PersonnelFormDialog open={editOpen} onOpenChange={setEditOpen} user={user} />

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={user.is_active ? "Désactiver le compte" : "Réactiver le compte"}
        description={
          user.is_active
            ? `${user.email} ne pourra plus se connecter. Son historique (notes, séances…) est conservé.`
            : `${user.email} pourra de nouveau se connecter.`
        }
        confirmLabel={user.is_active ? "Désactiver" : "Réactiver"}
        destructive={user.is_active}
        loading={setActive.isPending}
        onConfirm={() =>
          setActive.mutate(
            { userId: user.id, active: !user.is_active },
            { onSuccess: () => setToggleOpen(false) },
          )
        }
      />
    </div>
  );
}
