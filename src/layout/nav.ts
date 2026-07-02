import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Gavel,
  GraduationCap,
  LayoutDashboard,
  School,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/api/types";

export const ALL_ROLES: readonly UserRole[] = [
  "DIRECTION",
  "ADMIN",
  "SECRETARIAT",
  "COMPTABLE",
  "ENSEIGNANT",
  "ETUDIANT",
  "PARENT",
];

/** Source unique des accès par module — utilisée par la sidebar ET les guards du routeur. */
export const MODULE_ROLES = {
  dashboard: ALL_ROLES,
  monEspace: ["ETUDIANT"],
  etudiants: ["DIRECTION", "ADMIN", "SECRETARIAT"],
  classes: ["DIRECTION", "ADMIN", "SECRETARIAT"],
  seances: ["DIRECTION", "ADMIN", "ENSEIGNANT"],
  presences: ["DIRECTION", "ADMIN"],
  notes: ["DIRECTION", "ADMIN", "ENSEIGNANT"],
  paiements: ["DIRECTION", "ADMIN", "COMPTABLE"],
  sanctions: ["DIRECTION", "ADMIN", "SECRETARIAT"],
  matieres: ["DIRECTION", "ADMIN"],
  personnel: ["DIRECTION", "ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, roles: MODULE_ROLES.dashboard },
  { to: "/mon-espace", label: "Mon espace", icon: UserRound, roles: MODULE_ROLES.monEspace },
  { to: "/etudiants", label: "Étudiants", icon: GraduationCap, roles: MODULE_ROLES.etudiants },
  { to: "/classes", label: "Classes", icon: School, roles: MODULE_ROLES.classes },
  { to: "/seances", label: "Séances", icon: CalendarClock, roles: MODULE_ROLES.seances },
  { to: "/presences", label: "Présences", icon: CalendarCheck, roles: MODULE_ROLES.presences },
  { to: "/notes", label: "Notes", icon: ClipboardList, roles: MODULE_ROLES.notes },
  { to: "/paiements", label: "Paiements", icon: CreditCard, roles: MODULE_ROLES.paiements },
  { to: "/sanctions", label: "Sanctions", icon: Gavel, roles: MODULE_ROLES.sanctions },
  { to: "/matieres", label: "Matières", icon: BookOpen, roles: MODULE_ROLES.matieres },
  { to: "/personnel", label: "Personnel", icon: Users, roles: MODULE_ROLES.personnel },
];
