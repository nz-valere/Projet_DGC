import { Loader2, Save } from "lucide-react";
import * as React from "react";
import type { MatiereResponse } from "@/api/types";
import { ErrorState } from "@/components/shared/error-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/features/users/api";
import { useMatiere, useSetMatiereEnseignants } from "./api";

interface MatiereEnseignantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matiere: MatiereResponse;
}

export function MatiereEnseignantsDialog({
  open,
  onOpenChange,
  matiere,
}: MatiereEnseignantsDialogProps) {
  const enseignantsQuery = useUsers("ENSEIGNANT");
  const detailQuery = useMatiere(open ? matiere.id : "");
  const setEnseignants = useSetMatiereEnseignants(matiere.id);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open && detailQuery.data) {
      setSelected(new Set(detailQuery.data.enseignants.map((e) => e.id)));
    }
  }, [open, detailQuery.data]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    await setEnseignants.mutateAsync({ enseignant_ids: [...selected] });
    onOpenChange(false);
  };

  const enseignants = enseignantsQuery.data ?? [];
  const loading = enseignantsQuery.isPending || detailQuery.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={setEnseignants.isPending ? () => undefined : onOpenChange}
      title={`Enseignants — ${matiere.nom}`}
      description="Sélectionnez les enseignants qui assurent cette matière."
    >
      {enseignantsQuery.isError ? (
        <ErrorState
          error={enseignantsQuery.error}
          onRetry={() => void enseignantsQuery.refetch()}
        />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : enseignants.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucun compte enseignant disponible.
        </p>
      ) : (
        <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
          {enseignants.map((enseignant) => (
            <label
              key={enseignant.id}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:bg-accent has-[:checked]:border-brand/30 has-[:checked]:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.has(enseignant.id)}
                onChange={() => toggle(enseignant.id)}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              <span className="flex-1">{enseignant.email}</span>
              {enseignant.matricule ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {enseignant.matricule}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      )}

      <DialogFooter className="gap-2 pt-4">
        <span className="mr-auto self-center text-xs text-muted-foreground">
          {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={setEnseignants.isPending}
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </Button>
        <Button type="button" disabled={setEnseignants.isPending || loading} onClick={onSave}>
          {setEnseignants.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </DialogFooter>
    </FormDialog>
  );
}
