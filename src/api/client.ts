import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8001";

/** Erreur API normalisée : statut HTTP + message lisible (champ `detail` du backend). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}//http://localhost:8001/

let authToken: string | null = null;

/** Définit le token Bearer envoyé sur toutes les requêtes (null = aucun). */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Token Bearer courant (null si non connecté). */
export function getAuthToken(): string | null {
  return authToken;
}

let unauthorizedHandler: (() => void) | null = null;

/** Branché par l'AuthProvider : déclenché sur toute réponse 401 (session expirée). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

const authMiddleware: Middleware = {
  onRequest({ request }) {
    if (authToken) {
      request.headers.set("Authorization", `Bearer ${authToken}`);
    }
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    return response;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);

/** Message lisible par code HTTP, quand l'API ne fournit pas de `detail` exploitable. */
export function statusMessage(status: number): string {
  switch (status) {
    case 401:
      return "Session expirée ou identifiants invalides. Reconnectez-vous.";
    case 403:
      return "Accès refusé : vos droits ne permettent pas cette action.";
    case 404:
      return "Ressource introuvable. Elle a peut-être été supprimée.";
    case 409:
      return "Conflit : cette donnée existe déjà ou a été modifiée entre-temps.";
    case 422:
      return "Données invalides. Vérifiez les champs saisis.";
    case 429:
      return "Trop de tentatives. Patientez quelques instants puis réessayez.";
    case 502:
    case 503:
    case 504:
      return "Serveur momentanément indisponible. Réessayez dans un instant.";
    default:
      if (status >= 500) {
        return "Erreur interne du serveur (base de données injoignable ou panne). Contactez l'administrateur si cela persiste.";
      }
      return `Erreur ${status}`;
  }
}

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  // Erreur 422 FastAPI : detail est une liste de ValidationError
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : null,
      )
      .filter((message): message is string => message !== null);
    if (messages.length > 0) return messages.join(" · ");
  }
  return null;
}

interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Déballe une réponse openapi-fetch : renvoie `data` ou lève une ApiError
 * avec le message `detail` renvoyé par le backend.
 */
export function unwrap<T>(result: ApiResult<T>): T {
  if (result.error !== undefined) {
    const status = result.response.status;
    const detail = (result.error as { detail?: unknown } | null)?.detail;
    // Sur une 5xx, le `detail` éventuel est un message technique (ex. « Internal
    // Server Error ») : on préfère toujours le message lisible par statut.
    const message =
      status >= 500 ? statusMessage(status) : (detailToMessage(detail) ?? statusMessage(status));
    throw new ApiError(status, message);
  }
  return result.data as T;
}

/** Message d'erreur lisible pour toasts et écrans d'erreur. */
export function extractErrorMessage(
  error: unknown,
  fallback = "Une erreur inattendue est survenue.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    return "Impossible de joindre le serveur : API arrêtée, ou erreur interne côté serveur (consultez les logs du backend).";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
