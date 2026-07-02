import { Check, X } from "lucide-react";
import type * as React from "react";
import type { StatutInscription } from "@/api/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Demande créée", hint: "Par le secrétariat" },
  { label: "Compte activé", hint: "Via l'e-mail d'activation" },
  { label: "Dossier & contrôle", hint: "Pièces et paiement" },
  { label: "Inscrit", hint: "Validation du secrétariat" },
] as const;

/** Étape atteinte (index de l'étape courante) selon le statut d'inscription. */
function currentStep(statut: StatutInscription): number {
  switch (statut) {
    case "EN_ATTENTE_ACTIVATION":
      return 1;
    case "EN_ATTENTE_VALIDATION":
      return 2;
    case "INSCRIT":
      return 4; // toutes les étapes franchies
    case "REJETE":
      return 2; // rejeté au stade du contrôle de dossier
  }
}

interface InscriptionTimelineProps {
  statut: StatutInscription;
  className?: string;
}

/** Parcours d'inscription en 4 étapes — partagé fiche staff / portail étudiant. */
export function InscriptionTimeline({ statut, className }: InscriptionTimelineProps) {
  const current = currentStep(statut);
  const rejected = statut === "REJETE";

  return (
    <ol className={cn("flex items-start", className)} aria-label="Parcours d'inscription">
      {STEPS.map((step, index) => {
        const done = index < current && !(rejected && index === current);
        const isCurrent = index === current && !rejected;
        const isRejectedHere = rejected && index === current;
        const upcoming = index > current;

        let circle: React.ReactNode;
        if (isRejectedHere) {
          circle = <X className="h-4 w-4" />;
        } else if (done) {
          circle = <Check className="h-4 w-4" />;
        } else {
          circle = <span className="text-xs font-semibold tabular-nums">{index + 1}</span>;
        }

        return (
          <li key={step.label} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "h-px flex-1",
                  index === 0 ? "bg-transparent" : done || isCurrent || isRejectedHere ? "bg-primary/50" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-brand bg-accent text-accent-foreground ring-4 ring-brand/15",
                  isRejectedHere &&
                    "border-destructive bg-destructive text-destructive-foreground",
                  upcoming && "border-border bg-card text-muted-foreground",
                )}
              >
                {circle}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-px flex-1",
                  index === STEPS.length - 1 ? "bg-transparent" : done ? "bg-primary/50" : "bg-border",
                )}
              />
            </div>
            <p
              className={cn(
                "mt-2 text-xs font-medium leading-tight",
                isRejectedHere && "text-destructive",
                upcoming && "text-muted-foreground",
              )}
            >
              {isRejectedHere ? "Demande rejetée" : step.label}
            </p>
            <p className="mt-0.5 hidden text-[0.68rem] text-muted-foreground sm:block">
              {isRejectedHere ? "Contactez le secrétariat" : step.hint}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
