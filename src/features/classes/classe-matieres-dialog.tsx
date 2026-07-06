import { Loader2, Save } from "lucide-react";
import * as React from "react";
import type { ClasseResponse } from "@/api/types";
import { ErrorState } from "@/components/shared/error-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatieres } from "@/features/matieres/api";
import { useClasseMatieres, useSetClasseMatieres } from "./api";

interface ClasseMatieresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classe: ClasseResponse;
}

export function ClasseMatieresDialog({ open, onOpenChange, classe }: ClasseMatieresDialogProps) {
  const matieresQuery = useMatieres();
  const assignedQuery = useClasseMatieres(open ? classe.id : "");
  const setMatieres = useSetClasseMatieres(classe.id);

  /** Matières retenues → coefficient saisi (chaîne pour tolérer la frappe en cours). */
  const [selected, setSelected] = React.useState<Map<string, string>>(new Map());

  // Initialise la sélection (et les coefficients de la classe) à l'ouverture.
  React.useEffect(() => {
    if (open && assignedQuery.data) {
      setSelected(
        new Map(assignedQuery.data.map((entry) => [entry.matiere.id, String(entry.coefficient)])),
      );
    }
  }, [open, assignedQuery.data]);

  const toggle = (id: string, defaultCoefficient: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, String(defaultCoefficient));
      return next;
    });
  };

  const setCoefficient = (id: string, value: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  };

  const invalidCount = [...selected.values()].filter(
    (raw) => !(Number(raw) > 0) || raw.trim() === "",
  ).length;

  const onSave = async () => {
    await setMatieres.mutateAsync({
      matieres: [...selected.entries()].map(([matiere_id, coefficient]) => ({
        matiere_id,
        coefficient: Number(coefficient),
      })),
    });
    onOpenChange(false);
  };

  const matieres = matieresQuery.data ?? [];
  const loading = matieresQuery.isPending || assignedQuery.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={setMatieres.isPending ? () => undefined : onOpenChange}
      title={`Programme — ${classe.nom}`}
      description="Sélectionnez les matières enseignées et leur coefficient dans cette classe (utilisé pour la moyenne du bulletin)."
    >
      {matieresQuery.isError ? (
        <ErrorState error={matieresQuery.error} onRetry={() => void matieresQuery.refetch()} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : matieres.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune matière au catalogue.
        </p>
      ) : (
        <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
          {matieres.map((matiere) => {
            const coefficient = selected.get(matiere.id);
            const checked = coefficient !== undefined;
            const invalid = checked && !(Number(coefficient) > 0);
            return (
              <div
                key={matiere.id}
                className={
                  checked
                    ? "flex items-center gap-3 rounded-md border border-brand/30 bg-accent px-3 py-2 text-sm"
                    : "flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-accent"
                }
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(matiere.id, matiere.coefficient)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{matiere.nom}</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">{matiere.code}</span>
                  </span>
                </label>
                {checked ? (
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    Coef.
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={coefficient}
                      onChange={(event) => setCoefficient(matiere.id, event.target.value)}
                      aria-label={`Coefficient de ${matiere.nom}`}
                      aria-invalid={invalid || undefined}
                      className={
                        invalid
                          ? "h-8 w-20 border-destructive text-right tabular-nums"
                          : "h-8 w-20 text-right tabular-nums"
                      }
                    />
                  </label>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    coef. global {matiere.coefficient}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DialogFooter className="gap-2 pt-4">
        <span className="mr-auto self-center text-xs text-muted-foreground">
          {invalidCount > 0
            ? `${invalidCount} coefficient${invalidCount > 1 ? "s" : ""} invalide${invalidCount > 1 ? "s" : ""}`
            : `${selected.size} matière${selected.size > 1 ? "s" : ""} au programme`}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={setMatieres.isPending}
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </Button>
        <Button
          type="button"
          disabled={setMatieres.isPending || loading || invalidCount > 0}
          onClick={onSave}
        >
          {setMatieres.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </DialogFooter>
    </FormDialog>
  );
}
