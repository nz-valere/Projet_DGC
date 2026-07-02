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
import { useGrades } from "@/features/grades/api";
import { useSeances } from "@/features/seances/api";
import { useStudents } from "@/features/students/api";
import { ROLE_LABELS } from "@/lib/labels";
import { todayISODate } from "@/lib/utils";
import { MODULE_ROLES, NAV_ITEMS } from "@/layout/nav";

/** Bannière « demandes à valider » — montée uniquement pour les rôles ayant accès aux étudiants. */
function PendingValidationBanner() {
  const studentsQuery = useStudents();
  const pending = (studentsQuery.data ?? []).filter(
    (student) => student.statut === "EN_ATTENTE_VALIDATION",
  ).length;

  if (pending === 0) return null;

  return (
    <Link
      to="/etudiants"
      className="mb-6 flex items-center gap-3 rounded-lg border border-brand/30 bg-accent px-4 py-3 text-sm text-accent-foreground transition-colors hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15">
        <UserCheck className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="font-semibold">
          {pending} demande{pending > 1 ? "s" : ""} d'inscription
        </span>{" "}
        en attente de validation.
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}

interface Kpi {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
}

/**
 * Bandeau de chiffres clés — la visibilité de chaque KPI est dérivée de MODULE_ROLES
 * (source unique déjà utilisée par la nav et les guards de routes), jamais codée en dur
 * par rôle : si l'accès à un module change, le KPI correspondant suit automatiquement.
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
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${displayName}`}
        description={`Espace ${ROLE_LABELS[user.role]} — Digital Generation Academy.`}
      />
      <KpiStrip />
      {(MODULE_ROLES.etudiants as readonly string[]).includes(user.role) ? (
        <PendingValidationBanner />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
