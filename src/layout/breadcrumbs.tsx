import { ChevronRight } from "lucide-react";
import * as React from "react";
import { Link, useMatches } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface CrumbHandle {
  crumb: string;
}

function hasCrumb(handle: unknown): handle is CrumbHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "crumb" in handle &&
    typeof (handle as CrumbHandle).crumb === "string"
  );
}

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => hasCrumb(match.handle))
    .map((match) => ({
      id: match.id,
      path: match.pathname,
      label: (match.handle as CrumbHandle).crumb,
    }));

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            {index > 0 ? (
              // Séparateurs et niveaux intermédiaires masqués sur mobile :
              // seule la page courante reste affichée sous `sm`.
              <ChevronRight
                className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block"
                aria-hidden="true"
              />
            ) : null}
            {isLast ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className={cn(
                  "shrink-0 text-muted-foreground hover:text-foreground",
                  "hidden sm:inline",
                )}
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
