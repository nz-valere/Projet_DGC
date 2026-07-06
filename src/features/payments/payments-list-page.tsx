import { Ban, CreditCard, HandCoins, MoreHorizontal, Search } from "lucide-react";
import * as React from "react";
import type { PaymentResponse } from "@/api/types";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { EnumBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useStudents } from "@/features/students/api";
import { MODE_PAIEMENT, STATUT_PAIEMENT } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";
import { usePayments } from "./api";
import { PaymentCancelDialog } from "./payment-cancel-dialog";
import { PaymentFormDialog } from "./payment-form-dialog";

const ALL = "__all__";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function PaymentsListPage() {
  const paymentsQuery = usePayments();
  const studentsQuery = useStudents();

  const [search, setSearch] = React.useState("");
  const [statut, setStatut] = React.useState(ALL);
  const [mode, setMode] = React.useState(ALL);

  const [formOpen, setFormOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<PaymentResponse | undefined>(undefined);

  const payments = React.useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  const studentById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of studentsQuery.data ?? []) {
      map.set(s.id, `${s.nom.toUpperCase()} ${s.prenom}`);
    }
    return map;
  }, [studentsQuery.data]);

  const stats = React.useMemo(() => {
    let encaisse = 0;
    let enAttente = 0;
    let annules = 0;
    for (const p of payments) {
      if (p.statut === "ANNULE") annules += 1;
      else encaisse += p.montant;
      if (p.statut === "EN_ATTENTE") enAttente += 1;
    }
    return { encaisse, enAttente, annules };
  }, [payments]);

  const statusCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of payments) counts.set(p.statut, (counts.get(p.statut) ?? 0) + 1);
    return counts;
  }, [payments]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statut !== ALL && payment.statut !== statut) return false;
      if (mode !== ALL && payment.mode_paiement !== mode) return false;
      if (query) {
        const haystack =
          `${studentById.get(payment.student_id) ?? ""} ${payment.reference} ${payment.numero_recu}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [payments, statut, mode, search, studentById]);

  const columns: DataTableColumn<PaymentResponse>[] = [
    {
      id: "recu",
      header: "Reçu n°",
      cell: (payment) => <span className="font-mono text-xs">{payment.numero_recu}</span>,
      sortValue: (payment) => payment.numero_recu,
    },
    {
      id: "etudiant",
      header: "Étudiant",
      cell: (payment) => (
        <span className="font-medium">{studentById.get(payment.student_id) ?? "—"}</span>
      ),
      sortValue: (payment) => studentById.get(payment.student_id) ?? "",
    },
    {
      id: "montant",
      header: "Montant",
      cell: (payment) => (
        <span className="tabular-nums">
          <span className="font-semibold">{formatMoney(payment.montant)}</span>
          <span className="text-xs text-muted-foreground">
            {" "}
            / {formatMoney(payment.montant_attendu)}
          </span>
        </span>
      ),
      sortValue: (payment) => payment.montant,
    },
    {
      id: "mode",
      header: "Mode",
      cell: (payment) => MODE_PAIEMENT[payment.mode_paiement],
      sortValue: (payment) => payment.mode_paiement,
    },
    {
      id: "reference",
      header: "Référence",
      cell: (payment) => <span className="font-mono text-xs">{payment.reference}</span>,
    },
    {
      id: "statut",
      header: "Statut",
      cell: (payment) => (
        <span title={payment.motif_annulation ?? undefined}>
          <EnumBadge map={STATUT_PAIEMENT} value={payment.statut} />
        </span>
      ),
      sortValue: (payment) => payment.statut,
    },
    {
      id: "date",
      header: "Date",
      cell: (payment) => formatDate(payment.created_at),
      sortValue: (payment) => payment.created_at,
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (payment) =>
        payment.statut !== "ANNULE" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions sur le paiement">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setCancelTarget(payment)}
              >
                <Ban /> Annuler (avec motif)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Paiements" description="Encaissements, reçus et annulations tracées.">
        <Button onClick={() => setFormOpen(true)}>
          <HandCoins /> Encaisser
        </Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total encaissé"
          value={formatMoney(stats.encaisse)}
          hint="hors paiements annulés"
        />
        <StatCard
          label="Paiements partiels"
          value={String(stats.enAttente)}
          hint="montant versé inférieur à l'attendu"
        />
        <StatCard label="Annulés" value={String(stats.annules)} hint="conservés pour l'audit" />
      </div>

      {/* Filtres rapides par statut, avec compteurs */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer par statut"
      >
        {(
          [
            [ALL, "Tous", payments.length],
            ...Object.entries(STATUT_PAIEMENT).map(
              ([value, style]) => [value, style.label, statusCounts.get(value) ?? 0] as const,
            ),
          ] as const
        ).map(([value, label, count]) => {
          const active = statut === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatut(value)}
              aria-pressed={active}
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
              }
            >
              {label}
              <span
                className={
                  active
                    ? "rounded-full bg-white/20 px-1.5 tabular-nums"
                    : "rounded-full bg-muted px-1.5 tabular-nums"
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher (étudiant, référence, reçu)…"
            className="pl-8"
            aria-label="Rechercher un paiement"
          />
        </div>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-44" aria-label="Filtrer par mode de paiement">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les modes</SelectItem>
            {Object.entries(MODE_PAIEMENT).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paymentsQuery.isError ? (
        <ErrorState error={paymentsQuery.error} onRetry={() => void paymentsQuery.refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(payment) => payment.id}
          isLoading={paymentsQuery.isPending || studentsQuery.isPending}
          pageSize={12}
          emptyState={
            payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Aucun paiement"
                description="Enregistrez le premier encaissement — reçu et référence sont générés automatiquement."
                action={
                  <Button onClick={() => setFormOpen(true)}>
                    <HandCoins /> Encaisser
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Aucun paiement ne correspond à ces critères."
              />
            )
          }
        />
      )}

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {cancelTarget ? (
        <PaymentCancelDialog
          key={cancelTarget.id}
          open
          onOpenChange={(open) => {
            if (!open) setCancelTarget(undefined);
          }}
          payment={cancelTarget}
          studentName={studentById.get(cancelTarget.student_id)}
        />
      ) : null}
    </div>
  );
}
