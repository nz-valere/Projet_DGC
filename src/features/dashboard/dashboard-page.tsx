import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/features/auth/auth-context";
import { useDisplayName } from "@/features/auth/use-display-name";
import { useClasses } from "@/features/classes/api";
import { useGrades } from "@/features/grades/api";
import { useMatieres } from "@/features/matieres/api";
import { OnlineNowCard } from "@/features/presence/online-now-card";
import { useSeances } from "@/features/seances/api";
import { useStudents } from "@/features/students/api";
import { ROLE_LABELS } from "@/lib/labels";
import { cn, todayISODate } from "@/lib/utils";
import { MODULE_ROLES, NAV_ITEMS } from "@/layout/nav";

const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" });

/* ── KPI ─────────────────────────────────────────────────────────── */

interface Kpi {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
}

/**
 * Chiffres clés — la visibilité de chaque KPI est dérivée de MODULE_ROLES
 * (source unique déjà utilisée par la nav et les guards) : si l'accès à un
 * module change, le KPI correspondant suit automatiquement.
 */
function useDashboardKpis(): Kpi[] {
  const user = useCurrentUser();

  const canSeeEtudiants = (MODULE_ROLES.etudiants as readonly string[]).includes(user.role);
  const canSeeNotes = (MODULE_ROLES.notes as readonly string[]).includes(user.role);
  const canSeeSeances = (MODULE_ROLES.seances as readonly string[]).includes(user.role);

  const studentsQuery = useStudents(canSeeEtudiants);
  const gradesQuery = useGrades(canSeeNotes);
  const seancesQuery = useSeances(canSeeSeances);

  return React.useMemo(() => {
    const kpis: Kpi[] = [];
    const isTeacherScoped = user.role === "ENSEIGNANT";
    const today = todayISODate();

    if (canSeeEtudiants) {
      const students = studentsQuery.data ?? [];
      kpis.push({
        id: "etudiants-inscrits",
        label: "Étudiants inscrits",
        value: students.filter((s) => s.statut === "INSCRIT").length,
        icon: GraduationCap,
        to: "/etudiants",
      });
      kpis.push({
        id: "demandes-attente",
        label: "Demandes en attente",
        value: students.filter((s) => s.statut === "EN_ATTENTE_VALIDATION").length,
        icon: UserCheck,
        to: "/etudiants",
      });
    }

    if (canSeeNotes) {
      const grades = gradesQuery.data ?? [];
      const scoped = isTeacherScoped
        ? grades.filter((g) => g.enseignant_id === user.id)
        : grades;
      kpis.push({
        id: "notes-attente",
        label: isTeacherScoped ? "Vos notes à traiter" : "Notes en attente",
        value: scoped.filter((g) => g.statut === "EN_ATTENTE" || g.statut === "REJETE").length,
        icon: ClipboardList,
        to: "/notes",
      });
    }

    if (canSeeSeances) {
      const seances = seancesQuery.data ?? [];
      const scoped = isTeacherScoped
        ? seances.filter((s) => s.enseignant_id === user.id)
        : seances;
      kpis.push({
        id: "seances-jour",
        label: isTeacherScoped ? "Vos séances aujourd'hui" : "Séances aujourd'hui",
        value: scoped.filter((s) => s.date === today).length,
        icon: CalendarClock,
        to: "/seances",
      });
    }

    return kpis;
  }, [
    canSeeEtudiants,
    canSeeNotes,
    canSeeSeances,
    studentsQuery.data,
    gradesQuery.data,
    seancesQuery.data,
    user.role,
    user.id,
  ]);
}

function KpiStrip() {
  const kpis = useDashboardKpis();
  if (kpis.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Link
          key={kpi.id}
          to={kpi.to}
          style={{ animationDelay: `${index * 50}ms` }}
          className="group animate-rise-in flex items-center gap-3 rounded-lg border bg-card p-4 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <kpi.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-2xl font-semibold tabular-nums leading-none">
              {kpi.value}
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">{kpi.label}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ── Rail « Aujourd'hui » : agenda des séances ───────────────────── */

function TodayAgenda() {
  const user = useCurrentUser();
  const seancesQuery = useSeances();
  const classesQuery = useClasses();
  const matieresQuery = useMatieres();

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
  const nowHM = new Date().toTimeString().slice(0, 5);

  const todaySeances = React.useMemo(() => {
    const scoped = (seancesQuery.data ?? []).filter(
      (s) => s.date === today && (user.role !== "ENSEIGNANT" || s.enseignant_id === user.id),
    );
    return scoped.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
  }, [seancesQuery.data, today, user.role, user.id]);

  return (
    <Card className="animate-rise-in" style={{ animationDelay: "200ms" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Aujourd'hui</CardTitle>
        <CardDescription>
          {todaySeances.length === 0
            ? "Aucune séance planifiée."
            : `${todaySeances.length} séance${todaySeances.length > 1 ? "s" : ""} au planning.`}
        </CardDescription>
      </CardHeader>
      {todaySeances.length > 0 ? (
        <div className="px-6 pb-5">
          <ol className="relative space-y-4 border-l pl-4">
            {todaySeances.map((seance) => {
              const debut = seance.heure_debut.slice(0, 5);
              const fin = seance.heure_fin.slice(0, 5);
              const ongoing = debut <= nowHM && nowHM <= fin;
              const past = fin < nowHM;
              return (
                <li key={seance.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                      ongoing ? "bg-brand ring-4 ring-brand/20" : past ? "bg-border" : "bg-primary/50",
                    )}
                  />
                  <p
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      ongoing ? "font-semibold text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    {debut}–{fin}
                    {ongoing ? " · en cours" : null}
                  </p>
                  <p className={cn("text-sm font-medium", past && "text-muted-foreground")}>
                    {matiereName.get(seance.matiere_id) ?? "Matière"}
                    <span className="text-muted-foreground">
                      {" "}
                      — {classeName.get(seance.classe_id) ?? "—"}
                    </span>
                  </p>
                  {seance.salle ? (
                    <p className="text-xs text-muted-foreground">Salle {seance.salle}</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <Link
            to="/seances"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Voir le planning <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

/* ── Rail : demandes d'inscription à traiter ─────────────────────── */

function PendingRequestsCard() {
  const studentsQuery = useStudents();
  const classesQuery = useClasses();

  const classeName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data ?? []) map.set(c.id, c.nom);
    return map;
  }, [classesQuery.data]);

  const pending = React.useMemo(
    () => (studentsQuery.data ?? []).filter((s) => s.statut === "EN_ATTENTE_VALIDATION"),
    [studentsQuery.data],
  );

  if (pending.length === 0) return null;

  return (
    <Card
      className="animate-rise-in border-brand/30"
      style={{ animationDelay: "260ms" }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-accent-foreground">
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          À traiter
        </CardTitle>
        <CardDescription>
          {pending.length} demande{pending.length > 1 ? "s" : ""} d'inscription en attente de
          validation.
        </CardDescription>
      </CardHeader>
      <div className="px-6 pb-5">
        <ul className="divide-y">
          {pending.slice(0, 4).map((student) => (
            <li key={student.id}>
              <Link
                to={`/etudiants/${student.id}`}
                className="group flex items-center gap-3 py-2.5 focus-visible:outline-none"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {(student.prenom[0] ?? "") + (student.nom[0] ?? "")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-primary">
                    {student.nom.toUpperCase()} {student.prenom}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {student.classe_id
                      ? (classeName.get(student.classe_id) ?? "—")
                      : "Sans classe"}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            </li>
          ))}
        </ul>
        {pending.length > 4 ? (
          <Link
            to="/etudiants"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Voir les {pending.length} demandes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

const MODULE_DESCRIPTIONS: Record<string, string> = {
  "/etudiants": "Inscriptions, dossiers et suivi des étudiants.",
  "/classes": "Filières, niveaux et matières par classe.",
  "/seances": "Planning des séances par classe et enseignant.",
  "/presences": "Saisie des présences par classe et corrections.",
  "/notes": "Saisie, validation et publication des notes.",
  "/paiements": "Encaissements, reçus et annulations.",
  "/sanctions": "Dossiers disciplinaires et validations.",
  "/matieres": "Catalogue des matières et affectations.",
  "/personnel": "Comptes du personnel et activations.",
};

export function DashboardPage() {
  const user = useCurrentUser();
  const displayName = useDisplayName();
  const modules = NAV_ITEMS.filter(
    (item) => item.to !== "/" && item.roles.includes(user.role),
  );

  const canSeeSeances = (MODULE_ROLES.seances as readonly string[]).includes(user.role);
  const canSeeEtudiants = (MODULE_ROLES.etudiants as readonly string[]).includes(user.role);
  /** /presence/online est réservé à DIRECTION/ADMIN (cf. backend). */
  const canSeePresence = user.role === "DIRECTION" || user.role === "ADMIN";
  const hasRail = canSeeSeances || canSeeEtudiants || canSeePresence;

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${displayName}`}
        description={`Espace ${ROLE_LABELS[user.role]} — ${fullDateFormatter.format(new Date())}.`}
      />

      <KpiStrip />

      <div className={cn("grid gap-6", hasRail && "lg:grid-cols-[1fr_20rem]")}>
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {modules.map((module, index) => (
            <Link
              key={module.to}
              to={module.to}
              style={{ animationDelay: `${index * 70}ms` }}
              className="group animate-rise-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="relative h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-card-hover">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <module.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand" />
                  </div>
                  <CardTitle className="pt-3">{module.label}</CardTitle>
                  <CardDescription>
                    {MODULE_DESCRIPTIONS[module.to] ?? "Accéder au module."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {hasRail ? (
          <aside className="space-y-4" aria-label="Activité du jour">
            {canSeeSeances ? <TodayAgenda /> : null}
            {canSeeEtudiants ? <PendingRequestsCard /> : null}
            {canSeePresence ? <OnlineNowCard /> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
