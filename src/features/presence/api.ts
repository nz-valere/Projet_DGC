import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";

/** Présence temps réel : on rafraîchit régulièrement pour garder l'indicateur vivant. */
const REFRESH_MS = 20_000;

export const presenceKeys = {
  all: ["presence"] as const,
  etudiants: () => [...presenceKeys.all, "etudiants"] as const,
  online: () => [...presenceKeys.all, "online"] as const,
};

/**
 * Nombre d'étudiants en ligne (agrégat, sans identités) — visible par tout
 * utilisateur authentifié, y compris un étudiant.
 */
export function useEtudiantsEnLigne(enabled = true) {
  return useQuery({
    queryKey: presenceKeys.etudiants(),
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: REFRESH_MS,
    queryFn: async () => unwrap(await api.GET("/presence/etudiants", {})),
  });
}

/**
 * Liste nominative de tous les connectés + total — réservé à la DIRECTION et à
 * l'ADMIN. Passer `enabled` false pour les autres rôles (évite un 403 inutile).
 */
export function useOnlinePresence(enabled = true) {
  return useQuery({
    queryKey: presenceKeys.online(),
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: REFRESH_MS,
    queryFn: async () => unwrap(await api.GET("/presence/online", {})),
  });
}
