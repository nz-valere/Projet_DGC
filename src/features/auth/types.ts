import type { UserRole } from "@/api/types";

export interface AuthUser {
  /** users.id — utilisé pour cree_par, enseignant_id, annule_par… */
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  /** Matricule renvoyé par /auth/me (peut être absent selon le compte). */
  matricule?: string | null;
  /** Prénom/nom si /auth/me les fournit (tous rôles) — sinon absent. */
  prenom?: string | null;
  nom?: string | null;
}

export interface AuthSession {
  /** JWT Bearer — null en mode mock (aucun header Authorization envoyé). */
  token: string | null;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
  /** Rôle choisi sur l'écran de connexion — uniquement consommé par l'adaptateur mock. */
  role?: UserRole;
}

/** Données nécessaires à l'activation d'une application d'authentification (TOTP). */
export interface TwoFaSetup {
  /** Clé secrète à saisir manuellement dans l'app d'authentification. */
  secret: string;
  /** URI otpauth:// (pour génération d'un QR code). */
  otpauthUri: string;
}

/**
 * Résultat d'un appel de login.
 * - `authenticated` : connexion terminée, session prête.
 * - `twofa_required` : 2FA déjà configuré, l'utilisateur doit saisir son code (verifyTwoFa).
 * - `twofa_setup_required` : 2FA pas encore configuré, à activer (setupTwoFa) puis saisir un code.
 */
export type LoginResult =
  | { status: "authenticated"; session: AuthSession }
  | { status: "twofa_required"; tempToken: string }
  | { status: "twofa_setup_required"; tempToken: string };

/**
 * Abstraction d'authentification.
 * L'adaptateur `http` parle au backend réel (POST /auth/login + 2FA + /auth/me).
 * L'adaptateur `mock` court-circuite tout ça (choix du rôle au login).
 */
export interface AuthAdapter {
  readonly mode: "mock" | "http";
  login(input: LoginInput): Promise<LoginResult>;
  /** Étape 2FA : échange (temp_token, code) contre une session authentifiée. */
  verifyTwoFa(tempToken: string, code: string): Promise<AuthSession>;
  /** Activation d'un compte via le lien e-mail : définit le mot de passe et ouvre la session. */
  activateAccount(token: string, password: string): Promise<AuthSession>;
  /** Démarre la configuration 2FA : renvoie le secret + l'URI otpauth à présenter. */
  setupTwoFa(tempToken: string): Promise<TwoFaSetup>;
  /** Demande un e-mail de réinitialisation. Renvoie le message de confirmation du backend. */
  requestPasswordReset(email: string): Promise<string>;
  /** Confirme la réinitialisation avec le jeton reçu. Renvoie le message de confirmation. */
  confirmPasswordReset(token: string, newPassword: string): Promise<string>;
  logout(): Promise<void>;
}
