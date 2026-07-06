import { StatusBadge } from "@/components/shared/status-badge";
import type { UserRole } from "@/api/types";
import { ROLE_LABELS } from "@/lib/labels";

/** Couleur d'identification par rôle du personnel (cohérente liste / fiche). */
const ROLE_CLASSES: Partial<Record<UserRole, string>> = {
  DIRECTION: "bg-primary/10 text-primary border-primary/30",
  ADMIN: "bg-sky-100 text-sky-800 border-sky-200",
  SECRETARIAT: "bg-violet-100 text-violet-800 border-violet-200",
  COMPTABLE: "bg-amber-100 text-amber-800 border-amber-200",
  ENSEIGNANT: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <StatusBadge
      label={ROLE_LABELS[role]}
      className={ROLE_CLASSES[role] ?? "bg-muted text-muted-foreground"}
    />
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <StatusBadge label="Actif" className="bg-emerald-100 text-emerald-800 border-emerald-200" />
  ) : (
    <StatusBadge label="Désactivé" className="bg-zinc-200 text-zinc-700 border-zinc-300" />
  );
}
