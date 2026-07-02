import { ChevronRight } from "lucide-react";
import * as React from "react";
import { Link, useMatches } from "react-router-dom";

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
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            {index > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            ) : null}
            {isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
