import { BookOpen, MoreHorizontal, Pencil, Plus, Search, Users } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { MatiereResponse } from "@/api/types";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useGrades } from "@/features/grades/api";
import { useMatieres } from "./api";
import { MatiereEnseignantsDialog } from "./matiere-enseignants-dialog";
import { MatiereFormDialog } from "./matiere-form-dialog";

const ALL = "__all__";

export function MatieresListPage() {
  const navigate = useNavigate();
  const matieresQuery = useMatieres();
  const gradesQuery = useGrades();

  const [search, setSearch] = React.useState("");
  const [filiere, setFiliere] = React.useState(ALL);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<MatiereResponse | undefined>(undefined);
  const [enseignantsTarget, setEnseignantsTarget] = React.useState<MatiereResponse | undefined>(
    undefined,
  );

  const matieres = React.useMemo(() => matieresQuery.data ?? [], [matieresQuery.data]);

  const notesByMatiere = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const grade of gradesQuery.data ?? []) {
      counts.set(grade.matiere_id, (counts.get(grade.matiere_id) ?? 0) + 1);
    }
    return counts;
  }, [gradesQuery.data]);

  const filieres = React.useMemo(
    () =>
      [...new Set(matieres.map((m) => m.filiere).filter((f): f is string => !!f))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [matieres],
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return matieres.filter((matiere) => {
      if (filiere !== ALL && matiere.filiere !== filiere) return false;
      if (query) {
        const haystack = `${matiere.nom} ${matiere.code} ${matiere.filiere ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [matieres, search, filiere]);

  return (
    <div>
      <PageHeader title="Matières" description="Catalogue des matières, enseignants et notes.">
        <Button onClick={() => setFormOpen(true)}>
          <Plus /> Nouvelle matière
        </Button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (nom, code, filière)…"
            className="pl-8"
            aria-label="Rechercher une matière"
          />
        </div>
        <Select value={filiere} onValueChange={setFiliere}>
          <SelectTrigger className="w-48" aria-label="Filtrer par filière">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les filières</SelectItem>
            {filieres.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {matieresQuery.isError ? (
        <ErrorState error={matieresQuery.error} onRetry={() => void matieresQuery.refetch()} />
      ) : matieresQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        matieres.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucune matière"
            description="Créez une première matière pour bâtir le catalogue pédagogique."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus /> Nouvelle matière
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Aucune matière ne correspond à ces critères."
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((matiere, index) => (
            <button
              key={matiere.id}
              type="button"
              onClick={() => navigate(`/matieres/${matiere.id}`)}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="group animate-rise-in text-left focus-visible:outline-none"
            >
              <Card className="relative h-full overflow-hidden p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-card-hover group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                />
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="border-brand/30 bg-accent font-mono text-[0.7rem] text-accent-foreground"
                  >
                    {matiere.code}
                  </Badge>
                  <div onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-2 -mt-2 h-8 w-8"
                          aria-label={`Actions pour ${matiere.nom}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditTarget(matiere)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEnseignantsTarget(matiere)}>
                          <Users /> Gérer les enseignants
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight">
                  {matiere.nom}
                </h3>
                {matiere.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {matiere.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Coef. <span className="font-semibold text-foreground">{matiere.coefficient}</span>
                  </span>
                  {matiere.filiere ? <span>{matiere.filiere}</span> : null}
                  <span className="ml-auto tabular-nums">
                    {notesByMatiere.get(matiere.id) ?? 0} note
                    {(notesByMatiere.get(matiere.id) ?? 0) > 1 ? "s" : ""}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <MatiereFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <MatiereFormDialog
        open={editTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        matiere={editTarget}
      />

      {enseignantsTarget ? (
        <MatiereEnseignantsDialog
          open={enseignantsTarget !== undefined}
          onOpenChange={(open) => {
            if (!open) setEnseignantsTarget(undefined);
          }}
          matiere={enseignantsTarget}
        />
      ) : null}
    </div>
  );
}
