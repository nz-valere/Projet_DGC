import { Loader2, Save, Scale } from "lucide-react";
import * as React from "react";
import { ErrorState } from "@/components/shared/error-state";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { usePonderation, useSetPonderation } from "./api";

interface PonderationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS = [
  { key: "cc", label: "Contrôle continu", barClass: "bg-sky-500" },
  { key: "projet", label: "Projet", barClass: "bg-violet-500" },
  { key: "examen", label: "Examen final", barClass: "bg-[hsl(var(--primary))]" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

/**
 * Réglage ADMIN/DIRECTION de la pondération CC / Projet / Examen final
 * appliquée à la moyenne de chaque matière du bulletin (somme = 100).
 */
export function PonderationDialog({ open, onOpenChange }: PonderationDialogProps) {
  const ponderationQuery = usePonderation(open);
  const setPonderation = useSetPonderation();

  const [values, setValues] = React.useState<Record<FieldKey, string>>({
    cc: "30",
    projet: "20",
    examen: "50",
  });

  React.useEffect(() => {
    if (open && ponderationQuery.data) {
      setValues({
        cc: String(ponderationQuery.data.pourcentage_cc),
        projet: String(ponderationQuery.data.pourcentage_projet),
        examen: String(ponderationQuery.data.pourcentage_examen_final),
      });
    }
  }, [open, ponderationQuery.data]);

  const numbers = {
    cc: Number(values.cc),
    projet: Number(values.projet),
    examen: Number(values.examen),
  };
  const allValid = Object.values(numbers).every((n) => Number.isFinite(n) && n >= 0);
  const total = numbers.cc + numbers.projet + numbers.examen;
  const totalOk = allValid && Math.abs(total - 100) < 0.01;

  const onSave = async () => {
    await setPonderation.mutateAsync({
      pourcentage_cc: numbers.cc,
      pourcentage_projet: numbers.projet,
      pourcentage_examen_final: numbers.examen,
    });
    onOpenChange(false);
  };

  const pending = setPonderation.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={pending ? () => undefined : onOpenChange}
      title="Pondération des évaluations"
      description="Poids de chaque type d'évaluation dans la moyenne d'une matière. La somme doit valoir 100 % ; les types non notés sont renormalisés automatiquement."
    >
      {ponderationQuery.isError ? (
        <ErrorState
          error={ponderationQuery.error}
          onRetry={() => void ponderationQuery.refetch()}
        />
      ) : ponderationQuery.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Répartition visuelle en direct */}
          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
              {allValid && total > 0
                ? FIELDS.map(({ key, barClass }) => (
                    <div
                      key={key}
                      className={`${barClass} transition-all duration-300`}
                      style={{ width: `${(numbers[key] / total) * 100}%` }}
                    />
                  ))
                : null}
            </div>
            <p
              className={
                totalOk
                  ? "mt-1.5 text-right text-xs tabular-nums text-muted-foreground"
                  : "mt-1.5 text-right text-xs font-medium tabular-nums text-destructive"
              }
              role="status"
            >
              Total : {Number.isFinite(total) ? total : "—"} % {totalOk ? "" : "(doit valoir 100)"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FIELDS.map(({ key, label, barClass }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`ponderation-${key}`} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${barClass}`} aria-hidden />
                  {label}
                </Label>
                <div className="relative">
                  <Input
                    id={`ponderation-${key}`}
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={values[key]}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    className="pr-7 text-right tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>

          {ponderationQuery.data ? (
            <p className="text-xs text-muted-foreground">
              Dernière modification : {formatDateTime(ponderationQuery.data.updated_at)}
            </p>
          ) : null}
        </div>
      )}

      <DialogFooter className="gap-2 pt-4">
        <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button
          type="button"
          disabled={pending || ponderationQuery.isPending || !totalOk}
          onClick={onSave}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </DialogFooter>
    </FormDialog>
  );
}

/** Bouton d'ouverture réutilisable (affiché aux seuls ADMIN/DIRECTION). */
export function PonderationButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Scale /> Pondération
      </Button>
      <PonderationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
