import { useMyProfile } from "@/features/me/api";
import { useCurrentUser } from "./auth-context";

/**
 * Nom à afficher pour l'utilisateur connecté, par ordre de priorité :
 *   1) prénom/nom fournis par /auth/me (forward-compatible, tous rôles) ;
 *   2) pour un étudiant, son profil /me/profile (« Prénom Nom ») ;
 *   3) repli sur l'e-mail.
 */
export function useDisplayName(): string {
  const user = useCurrentUser();
  const isStudent = user.role === "ETUDIANT";
  // Inutile d'appeler /me/profile si /auth/me a déjà donné le nom.
  const hasUserName = Boolean(user.prenom || user.nom);
  const profileQuery = useMyProfile(isStudent && !hasUserName);

  const fromUser = [user.prenom, user.nom].filter(Boolean).join(" ").trim();
  if (fromUser) return fromUser;

  if (isStudent && profileQuery.data) {
    const full = `${profileQuery.data.prenom} ${profileQuery.data.nom}`.trim();
    if (full) return full;
  }

  return user.displayName;
}
