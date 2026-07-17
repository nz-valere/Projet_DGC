import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Point de rupture en dessous duquel une colonne secondaire est masquée. */
export type HideBelowBreakpoint = "sm" | "md" | "lg" | "xl";

const HIDE_BELOW_CLASS: Record<HideBelowBreakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Si fourni, la colonne devient triable. */
  sortValue?: (row: T) => string | number | null;
  className?: string;
  headerClassName?: string;
  /**
   * Masque la colonne sous ce point de rupture (mobile / petite tablette).
   * Réservez-le aux colonnes secondaires : l'identité de la ligne, le statut
   * et les actions doivent rester visibles.
   */
  hideBelow?: HideBelowBreakpoint;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

type SortDirection = "asc" | "desc";

interface SortState {
  columnId: string;
  direction: SortDirection;
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base", numeric: true });
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  pageSize = 10,
  isLoading = false,
  emptyState,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState | null>(null);
  const [page, setPage] = React.useState(0);

  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const column = columns.find((candidate) => candidate.id === sort.columnId);
    const sortValue = column?.sortValue;
    if (!sortValue) return data;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => factor * compareValues(sortValue(a), sortValue(b)));
  }, [data, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Revenir à la première page quand le jeu de données change (recherche, filtres…)
  React.useEffect(() => {
    setPage(0);
  }, [data.length]);

  function toggleSort(columnId: string) {
    setSort((previous) => {
      if (previous?.columnId !== columnId) return { columnId, direction: "asc" };
      if (previous.direction === "asc") return { columnId, direction: "desc" };
      return null;
    });
  }

  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={pageSize > 8 ? 8 : pageSize} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "text-[0.7rem] font-semibold uppercase tracking-wider",
                    column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
                    column.headerClassName,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                      onClick={() => toggleSort(column.id)}
                    >
                      {column.header}
                      {sort?.columnId === column.id ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(
                    "transition-colors hover:bg-accent/40",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {sorted.length > pageSize ? (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sorted.length)} sur{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft /> Précédent
            </Button>
            <span>
              Page {currentPage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Suivant <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
