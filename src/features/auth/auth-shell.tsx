import type * as React from "react";

interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Coquille commune des écrans publics (connexion, activation, réinitialisation) :
 * panneau institutionnel marine à gauche, formulaire sur papier à droite.
 */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Panneau marque ─────────────────────────────────────────── */}
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
        {/* Décor : halo cyan + anneaux concentriques, discrets */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/[0.06]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/[0.08]" />
          <div className="absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full border border-white/[0.05]" />
          <div className="absolute right-0 top-0 h-96 w-96 bg-[radial-gradient(circle_at_top_right,hsl(var(--brand)/0.22),transparent_65%)]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--brand)/0.10),transparent_60%)]" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="rounded-md bg-white p-1.5 ring-1 ring-white/10">
            <img src="/dga-icon-512.png" alt="" className="h-10 w-10" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight text-white">DGA</p>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-sidebar-foreground/80">
              Digital Generation Academy
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-5">
          <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-brand" />
          <p className="font-display text-3xl font-medium leading-snug text-white xl:text-4xl">
            La rigueur académique,
            <br />
            au service de chaque étudiant.
          </p>
          <p className="text-sm leading-relaxed text-sidebar-foreground/90">
            Inscriptions, présences, notes et paiements — l'ensemble de la vie scolaire,
            orchestré sur une seule plateforme.
          </p>
        </div>

        <p className="relative text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} Digital Generation Academy — Gestion Académique &amp;
          Administrative
        </p>
      </aside>

      {/* ── Formulaire ─────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-rise-in">
          {/* Logo mobile (panneau masqué) */}
          <img
            src="/dga-logo-transparent.png"
            alt="Digital Generation Academy"
            className="mx-auto mb-6 h-20 w-auto lg:hidden"
          />
          <div className="mb-8 space-y-2">
            <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-brand" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
