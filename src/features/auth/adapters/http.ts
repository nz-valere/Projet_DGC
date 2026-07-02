import { API_URL, ApiError, getAuthToken, statusMessage } from "@/api/client";
import type { UserRole } from "@/api/types";
import type {
  AuthAdapter,
  AuthSession,
  LoginInput,
  LoginResult,
  TwoFaSetup,
} from "../types";

/** Réponse de POST /auth/login (flux 2FA). */
interface LoginResponse {
  requires_2fa?: boolean;
  requires_2fa_setup?: boolean;
  temp_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
}

/** Réponse de GET /auth/me. `prenom`/`nom` sont optionnels (selon version du backend). */
interface MeResponse {
  id: string;
  email: string;
  matricule: string | null;
  role: UserRole;
  is_active: boolean;
  prenom?: string | null;
  nom?: string | null;
}

/** POST JSON avec extraction du message d'erreur `detail` du backend. */
async function postJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // 5xx : panne serveur (base injoignable…), le fallback métier (« Identifiants
    // invalides ») serait mensonger — on affiche un message serveur explicite.
    let message = response.status >= 500 ? statusMessage(response.status) : fallback;
    if (response.status < 500) {
      try {
        const parsed = (await response.json()) as { detail?: unknown };
        if (typeof parsed.detail === "string") message = parsed.detail;
      } catch {
        // corps non-JSON : on garde le message générique
      }
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

/** Récupère le profil (/auth/me) et construit la session à partir du token. */
async function fetchSession(token: string): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status, "Impossible de récupérer le profil utilisateur.");
  }

  const me = (await response.json()) as MeResponse;
  const fullName = [me.prenom, me.nom].filter(Boolean).join(" ").trim();

  return {
    token,
    user: {
      id: me.id,
      email: me.email,
      role: me.role,
      matricule: me.matricule ?? null,
      prenom: me.prenom ?? null,
      nom: me.nom ?? null,
      // Dès que /auth/me fournit prenom/nom, le nom complet prime (tous rôles).
      displayName: fullName || me.email.split("@")[0] || me.email,
    },
  };
}

/**
 * Adaptateur réel — backend DGA (VITE_AUTH_MOCK=false).
 *
 * Flux :
 *   POST /auth/login {email, password} → LoginResponse
 *     • access_token présent  → connecté (on charge /auth/me)
 *     • requires_2fa_setup    → activer le 2FA (setupTwoFa) puis verifyTwoFa
 *     • requires_2fa          → saisir le code (verifyTwoFa)
 *   POST /auth/2fa/setup  {temp_token}        → {secret, otpauth_uri}
 *   POST /auth/2fa/verify {temp_token, code}  → {access_token}
 *   GET  /auth/me (Bearer)                    → profil utilisateur
 *   POST /auth/logout (Bearer)                → révocation
 */
export const httpAdapter: AuthAdapter = {
  mode: "http",

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const body = await postJson<LoginResponse>(
      "/auth/login",
      { email, password },
      "Identifiants invalides.",
    );

    if (body.access_token) {
      const session = await fetchSession(body.access_token);
      return { status: "authenticated", session };
    }

    if (!body.temp_token) {
      throw new ApiError(500, "Réponse de connexion inattendue du serveur.");
    }

    if (body.requires_2fa_setup) {
      return { status: "twofa_setup_required", tempToken: body.temp_token };
    }

    return { status: "twofa_required", tempToken: body.temp_token };
  },

  async verifyTwoFa(tempToken: string, code: string): Promise<AuthSession> {
    const body = await postJson<{ access_token: string }>(
      "/auth/2fa/verify",
      { temp_token: tempToken, code },
      "Code de vérification invalide.",
    );
    return fetchSession(body.access_token);
  },

  async activateAccount(token: string, password: string): Promise<AuthSession> {
    const body = await postJson<{ access_token: string }>(
      "/auth/activate",
      { token, password },
      "Lien d'activation invalide ou expiré.",
    );
    return fetchSession(body.access_token);
  },

  async setupTwoFa(tempToken: string): Promise<TwoFaSetup> {
    const body = await postJson<{ secret: string; otpauth_uri: string }>(
      "/auth/2fa/setup",
      { temp_token: tempToken },
      "Impossible d'initialiser la double authentification.",
    );
    return { secret: body.secret, otpauthUri: body.otpauth_uri };
  },

  async requestPasswordReset(email: string): Promise<string> {
    const body = await postJson<{ detail: string }>(
      "/auth/password-reset/request",
      { email },
      "Impossible d'envoyer la demande de réinitialisation.",
    );
    return body.detail;
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<string> {
    const body = await postJson<{ detail: string }>(
      "/auth/password-reset/confirm",
      { token, new_password: newPassword },
      "Impossible de réinitialiser le mot de passe.",
    );
    return body.detail;
  },

  async logout(): Promise<void> {
    const token = getAuthToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Révocation best-effort : on déconnecte localement quoi qu'il arrive.
    }
  },
};
