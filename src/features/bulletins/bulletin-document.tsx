import { Printer } from "lucide-react";
import type { BulletinLigne, BulletinResponse, TypeEvaluation } from "@/api/types";
import { Button } from "@/components/ui/button";
import { mentionFromMoyenne, SEMESTRE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** 1 → « 1er », sinon « n·e » (rang scolaire). */
function formatRang(rang: number): string {
  return rang === 1 ? "1er" : `${rang}e`;
}

function noteOf(ligne: BulletinLigne, type: TypeEvaluation): string {
  const entry = ligne.detail.find((d) => d.type_evaluation === type);
  return entry ? entry.moyenne.toFixed(2) : "—";
}

const MENTION_STYLES: Record<string, string> = {
  "Très bien": "border-emerald-300 bg-emerald-50 text-emerald-800",
  Bien: "border-sky-300 bg-sky-50 text-sky-800",
  "Assez bien": "border-cyan-300 bg-cyan-50 text-cyan-800",
  Passable: "border-amber-300 bg-amber-50 text-amber-800",
  Insuffisant: "border-red-300 bg-red-50 text-red-800",
};

interface BulletinDocumentProps {
  bulletin: BulletinResponse;
  /** Masque la barre d'outils (bouton imprimer) — ex. aperçu compact. */
  hideToolbar?: boolean;
  className?: string;
}

/**
 * Bulletin de notes officiel, prêt à imprimer (bouton « Imprimer » →
 * les styles @media print de index.css isolent la zone .print-area).
 */
export function BulletinDocument({ bulletin, hideToolbar, className }: BulletinDocumentProps) {
  const mention = mentionFromMoyenne(bulletin.moyenne_generale);
  const totalCoefficient = bulletin.lignes.reduce((sum, l) => sum + l.coefficient, 0);
  const totalPoints = bulletin.lignes.reduce((sum, l) => sum + l.moyenne * l.coefficient, 0);

  return (
    <div className={className}>
      {!hideToolbar ? (
        <div className="mb-3 flex justify-end print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Imprimer le bulletin
          </Button>
        </div>
      ) : null}

      <article
        className="print-area overflow-hidden rounded-lg border bg-card shadow-card"
        aria-label={`Bulletin de ${bulletin.prenom} ${bulletin.nom} — ${SEMESTRE_LABELS[bulletin.semestre]} ${bulletin.annee_academique}`}
      >
        {/* Filet institutionnel double, aux couleurs DGA */}
        <div className="h-1.5 bg-primary" aria-hidden />
        <div className="h-px bg-brand" aria-hidden />

        <div className="p-6 sm:p-8">
          {/* En-tête officiel */}
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-foreground/80 pb-5">
            <div className="flex items-center gap-4">
              <div
                className="grid h-14 w-14 place-items-center rounded border-2 border-primary font-display text-xl font-bold text-primary"
                aria-hidden
              >
                DGA
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Direction Générale Académique
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Bulletin de notes
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-semibold text-primary">
                {SEMESTRE_LABELS[bulletin.semestre]}
              </p>
              <p className="text-sm tabular-nums text-muted-foreground">
                Année académique {bulletin.annee_academique}
              </p>
            </div>
          </header>

          {/* Identité de l'étudiant */}
          <dl className="grid grid-cols-2 gap-4 border-b py-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Étudiant
              </dt>
              <dd className="font-medium">
                {bulletin.nom.toUpperCase()} {bulletin.prenom}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Matricule
              </dt>
              <dd className="font-mono text-xs">{bulletin.matricule}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Classe
              </dt>
              <dd className="font-medium">{bulletin.classe_nom}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Effectif classé
              </dt>
              <dd className="font-medium tabular-nums">{bulletin.effectif} étudiants</dd>
            </div>
          </dl>

          {/* Détail par matière */}
          <table className="mt-4 w-full border-collapse text-sm">
            <caption className="sr-only">
              Moyennes par matière ({bulletin.lignes.length} matières au programme)
            </caption>
            <thead>
              <tr className="border-b-2 border-foreground/70 text-left text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-2 font-semibold">
                  Matière
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  Coef.
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  CC
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  Projet
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  Examen
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  Moy. /20
                </th>
                <th scope="col" className="py-2 pl-2 text-right font-semibold">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {bulletin.lignes.map((ligne) => (
                <tr
                  key={ligne.matiere_id}
                  className={cn(
                    "border-b border-dashed last:border-solid",
                    !ligne.composee && "text-muted-foreground",
                  )}
                >
                  <td className="py-2.5 pr-2">
                    <span className="font-medium text-foreground">{ligne.nom}</span>{" "}
                    <span className="font-mono text-[0.65rem] text-muted-foreground">
                      {ligne.code}
                    </span>
                    {!ligne.composee ? (
                      <span className="ml-1.5 rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-amber-700">
                        non composée
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{ligne.coefficient}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{noteOf(ligne, "CC")}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {noteOf(ligne, "PROJET")}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {noteOf(ligne, "EXAMEN_FINAL")}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-center font-semibold tabular-nums",
                      ligne.composee && ligne.moyenne < 10 && "text-destructive",
                    )}
                  >
                    {ligne.moyenne.toFixed(2)}
                  </td>
                  <td className="py-2.5 pl-2 text-right tabular-nums">
                    {(ligne.moyenne * ligne.coefficient).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/70 text-sm font-semibold">
                <td className="py-2.5 pr-2 text-right uppercase tracking-wide text-muted-foreground">
                  Totaux
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums">{totalCoefficient}</td>
                <td colSpan={3} aria-hidden />
                <td className="px-2 py-2.5" aria-hidden />
                <td className="py-2.5 pl-2 text-right tabular-nums">{totalPoints.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Synthèse : moyenne générale, rang, mention */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border-2 border-primary bg-accent/60 p-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent-foreground">
                Moyenne générale
              </p>
              <p className="font-display text-4xl font-bold tabular-nums text-primary">
                {bulletin.moyenne_generale.toFixed(2)}
                <span className="text-lg font-medium text-muted-foreground"> / 20</span>
              </p>
            </div>
            <div className="rounded-md border p-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Rang
              </p>
              <p className="font-display text-4xl font-bold tabular-nums">
                {formatRang(bulletin.rang)}
                <span className="text-lg font-medium text-muted-foreground">
                  {" "}
                  / {bulletin.effectif}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md border p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Mention
              </p>
              {/* Tampon de mention, façon cachet administratif */}
              <p
                className={cn(
                  "mt-1.5 -rotate-2 rounded border-2 px-3 py-1 font-display text-lg font-semibold uppercase tracking-wide",
                  MENTION_STYLES[mention],
                )}
              >
                {mention}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[0.65rem] leading-relaxed text-muted-foreground">
            Seules les notes publiées sont prises en compte. La moyenne de chaque matière combine
            contrôle continu, projet et examen final selon la pondération en vigueur ; une matière
            au programme non composée compte zéro. Les ex æquo partagent le même rang.
          </p>
        </div>
      </article>
    </div>
  );
}
