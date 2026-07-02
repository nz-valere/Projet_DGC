import { FileText } from "lucide-react";
import type { DocumentResponse } from "@/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { TYPE_DOCUMENT } from "@/lib/labels";
import { formatBytes, formatDate } from "@/lib/utils";

/** Liste de pièces — partagée entre la fiche staff et le portail étudiant. */
export function DocumentsList({
  documents,
  isLoading,
  emptyLabel = "Aucune pièce déposée.",
}: {
  documents: DocumentResponse[];
  isLoading: boolean;
  emptyLabel?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{TYPE_DOCUMENT[doc.type_document]}</p>
            <p className="truncate text-xs text-muted-foreground">{doc.nom_fichier}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p className="tabular-nums">{formatBytes(doc.taille_octets)}</p>
            <p>{formatDate(doc.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
