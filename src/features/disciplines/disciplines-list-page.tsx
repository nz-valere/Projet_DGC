import {
  CheckCircle2,
  Gavel,
  MoreHorizontal,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import * as React from "react";
import type { DisciplineResponse } from "@/api/types";
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
import { useStudents } from "@/features/students/api";
import { GRAVITE_SANCTION, STATUT_VALIDATION } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { useDisciplines, useValidateDiscipline } from "./api";
import { DisciplineFormDialog } from "./discipline-form-dialog";

const ALL = "__all__";

const EXCLUSIONS = new Set(["EXCLUSION_TEMP", "EXCLUSION_DEF"]);

export function DisciplinesListPage() {
  const user = useCurrentUser();
  /** Création de fiche : ADMIN/DIRECTION. Validation d'exclusion : DIRECTION seule. */
  const canCreate = user.role === "ADMIN" || user.role === "DIRECTION";

  const disciplinesQuery = useDisciplines();
  const studentsQuery = useStudents();
  const validateDiscipline = useValidateDiscipline();

  const [search, setSearch] = React.useState("");
  const [statut, setStatut] = React.useState(ALL);
  const [gravite, setGravite] = React.useState(ALL);

  const [formOpen, setFormOpen] = React.useState(false);
  const [validateTarget, setValidateTarget] = React.useState<DisciplineResponse | undefined>(
    undefined,
  );
  const [rejectTarget, setRejectTarget] = React.useState<DisciplineResponse | undefined>(
    undefined,
  );

  const disciplines = React.useMemo(() => disciplinesQuery.data ?? [], [disciplinesQuery.data]);

  const studentById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of studentsQuery.data ?? []) {
      map.set(s.id, `${s.nom.toUpperCase()} ${s.prenom}`);
    }
    return map;
  }, [studentsQuery.data]);

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of disciplines) {
      counts.set(d.statut_validation, (counts.get(d.statut_validation) ?? 0) + 1);
    }
    return counts;
  }, [disciplines]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return disciplines.filter((discipline) => {
      if (statut !== ALL && discipline.statut_validation !== statut) return false;
      if (gravite !== ALL && discipline.gravite !== gravite) return false;
      if (query) {
        const haystack =
          `${studentById.get(discipline.student_id) ?? ""} ${discipline.nature}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [disciplines, statut, gravite, search, studentById]);

  /** DIRECTION requise pour valider une exclusion — on désactive l'action sinon. */
  const canValidate = (discipline: DisciplineResponse) =>
    EXCLUSIONS.has(discipline.gravite) ? user.role === "DIRECTION" : canCreate;

  const columns: DataTableColumn<DisciplineResponse>[] = [
    {
      id: "etudiant",
      header: "Étudiant",
      cell: (discipline) => (
        <span className="font-medium">{studentById.get(discipline.student_id) ?? "—"}</span>
      ),
      sortValue: (discipline) => studentById.get(discipline.student_id) ?? "",
    },
    {
      id: "nature",
      header: "Nature",
      cell: (discipline) => discipline.nature,
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
    },
    {
      id: "validation",
      header: "Validation",
      cell: (discipline) => (
        <span className="flex items-center gap-1.5">
          <EnumBadge map={STATUT_VALIDATION} value={discipline.statut_validation} />
          {discipline.compte_suspendu ? (
            <span
              className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-red-700"
              title="Le compte de l'étudiant est suspendu"
            >
              <ShieldAlert className="h-3 w-3" /> compte suspendu
            </span>
          ) : null}
        </span>
      ),
      sortValue: (discipline) => discipline.statut_validation,
    },
    {
      id: "date",
      header: "Créée le",
      cell: (discipline) => formatDate(discipline.created_at),
      sortValue: (discipline) => discipline.created_at,
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (discipline) => {
        if (discipline.statut_validation !== "EN_ATTENTE" || !canValidate(discipline)) {
          return null;
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions sur la sanction">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setValidateTarget(discipline)}>
                <CheckCircle2 /> Valider
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setRejectTarget(discipline)}
              >
                <XCircle /> Rejeter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sanctions"
        description="Fiches d'incident et validation hiérarchique — les exclusions relèvent de la direction."
      >
        {canCreate ? (
          <Button onClick={() => setFormOpen(true)}>
            <Gavel /> Nouvelle fiche
          </Button>
        ) : null}
      </PageHeader>

      {/* Filtres rapides par statut de validation, avec compteurs */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer par validation"
      >
        {(
          [
            [ALL, "Toutes", disciplines.length],
            ["EN_ATTENTE", "En attente", statusCounts.get("EN_ATTENTE") ?? 0],
            ["VALIDE", "Validées", statusCounts.get("VALIDE") ?? 0],
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (étudiant, nature)…"
            className="pl-8"
            aria-label="Rechercher une sanction"
          />
        </div>
        <Select value={gravite} onValueChange={setGravite}>
          <SelectTrigger className="w-52" aria-label="Filtrer par gravité">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les gravités</SelectItem>
            {Object.entries(GRAVITE_SANCTION).map(([value, style]) => (
              <SelectItem key={value} value={value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {disciplinesQuery.isError ? (
        <ErrorState
          error={disciplinesQuery.error}
          onRetry={() => void disciplinesQuery.refetch()}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(discipline) => discipline.id}
          isLoading={disciplinesQuery.isPending || studentsQuery.isPending}
          pageSize={12}
          emptyState={
            disciplines.length === 0 ? (
              <EmptyState
                icon={Gavel}
                title="Aucune sanction"
                description="Aucun dossier disciplinaire ouvert."
                action={
                  canCreate ? (
                    <Button onClick={() => setFormOpen(true)}>
                      <Gavel /> Nouvelle fiche
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucune sanction ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <DisciplineFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={validateTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setValidateTarget(undefined);
        }}
        title="Valider la sanction"
        description={
          validateTarget
            ? `Valider la sanction « ${GRAVITE_SANCTION[validateTarget.gravite].label} » de ${
                studentById.get(validateTarget.student_id) ?? "l'étudiant"
              } ?${
                EXCLUSIONS.has(validateTarget.gravite)
                  ? " Le compte de l'étudiant sera suspendu."
                  : ""
              }`
            : undefined
        }
        confirmLabel="Valider"
        destructive={validateTarget ? EXCLUSIONS.has(validateTarget.gravite) : false}
        loading={validateDiscipline.isPending}
        onConfirm={() => {
          if (!validateTarget) return;
          validateDiscipline.mutate(
            {
              disciplineId: validateTarget.id,
              statut_validation: "VALIDE",
              valide_par: user.id,
            },
            { onSuccess: () => setValidateTarget(undefined) },
          );
        }}
      />

      <ConfirmDialog
        open={rejectTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(undefined);
        }}
        title="Rejeter la sanction"
        description={
          rejectTarget
            ? `Rejeter la fiche « ${rejectTarget.nature} » de ${
                studentById.get(rejectTarget.student_id) ?? "l'étudiant"
              } ? La fiche reste consultable dans l'historique.`
            : undefined
        }
        confirmLabel="Rejeter"
        destructive
        loading={validateDiscipline.isPending}
        onConfirm={() => {
          if (!rejectTarget) return;
          validateDiscipline.mutate(
            {
              disciplineId: rejectTarget.id,
              statut_validation: "REJETE",
              valide_par: user.id,
            },
            { onSuccess: () => setRejectTarget(undefined) },
          );
        }}
      />
    </div>
  );
}
