import { Loader2, Save } from "lucide-react";
import * as React from "react";
import type { ClasseResponse } from "@/api/types";
import { ErrorState } from "@/components/shared/error-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Initialise la sélection depuis les matières déjà affectées, à l'ouverture.
  React.useEffect(() => {
    if (open && assignedQuery.data) {
      setSelected(new Set(assignedQuery.data.map((m) => m.id)));
    }
  }, [open, assignedQuery.data]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    await setMatieres.mutateAsync({ matiere_ids: [...selected] });
    onOpenChange(false);
  };

  const matieres = matieresQuery.data ?? [];
  const loading = matieresQuery.isPending || assignedQuery.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={setMatieres.isPending ? () => undefined : onOpenChange}
      title={`Matières — ${classe.nom}`}
      description="Sélectionnez les matières enseignées dans cette classe."
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
            const checked = selected.has(matiere.id);
            return (
              <label
                key={matiere.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-accent has-[:checked]:border-brand/30 has-[:checked]:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(matiere.id)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span className="flex-1">
                  <span className="font-medium">{matiere.nom}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">{matiere.code}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <DialogFooter className="gap-2 pt-4">
        <span className="mr-auto self-center text-xs text-muted-foreground">
          {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={setMatieres.isPending}
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </Button>
        <Button type="button" disabled={setMatieres.isPending || loading} onClick={onSave}>
          {setMatieres.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </DialogFooter>
    </FormDialog>
  );
}
