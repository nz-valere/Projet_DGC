import { api } from "@/api/client";
import { ROLE_LABELS } from "@/lib/labels";
import type { AuthAdapter, AuthSession, LoginInput, LoginResult } from "../types";

/**
 * Adaptateur de développement (VITE_AUTH_MOCK=true) : aucun appel à /auth/login.
 * On choisit son rôle au login. Si le backend tourne, on se lie au premier
 * utilisateur réel de ce rôle pour que les ids (cree_par, enseignant_id…)
 * soient valides côté base de données. Le 2FA n'existe pas en mode mock.
 */
export const mockAdapter: AuthAdapter = {
  mode: "mock",

  async login({ email, role }: LoginInput): Promise<LoginResult> {
    const chosenRole = role ?? "ADMIN";
    let id = `mock-${chosenRole.toLowerCase()}`;
    let resolvedEmail = email.trim() || `${chosenRole.toLowerCase()}@dga.local`;

    try {
      const { data } = await api.GET("/users/", {
        params: { query: { role: chosenRole, limit: 1 } },
      });
      const realUser = data?.[0];
      if (realUser) {
        id = realUser.id;
        resolvedEmail = realUser.email;
      }
    } catch {
      // Backend injoignable : on garde l'identité fictive, l'UI reste utilisable.
    }

    return {
      status: "authenticated",
      session: {
        token: null,
        user: {
          id,
          email: resolvedEmail,
          role: chosenRole,
          matricule: null,
          displayName: resolvedEmail.split("@")[0] ?? ROLE_LABELS[chosenRole],
        },
      },
    };
  },

  async verifyTwoFa(): Promise<AuthSession> {
    throw new Error("Le 2FA n'est pas disponible en mode mock.");
  },

  async activateAccount(): Promise<AuthSession> {
    throw new Error("L'activation de compte n'est pas disponible en mode mock.");
  },

  async setupTwoFa(): Promise<never> {
    throw new Error("Le 2FA n'est pas disponible en mode mock.");
  },

  async requestPasswordReset(): Promise<string> {
    return "Mode démonstration : aucun e-mail n'est réellement envoyé.";
  },

  async confirmPasswordReset(): Promise<string> {
    return "Mode démonstration : réinitialisation simulée.";
  },

  async logout(): Promise<void> {
    // Rien à révoquer en mode mock.
  },
};
