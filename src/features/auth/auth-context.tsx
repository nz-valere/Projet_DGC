import * as React from "react";
import { setAuthToken, setUnauthorizedHandler } from "@/api/client";
import { queryClient } from "@/api/query-client";
import { authAdapter } from "./adapter";
import type { AuthSession, LoginInput, LoginResult, TwoFaSetup } from "./types";

const STORAGE_KEY = "dga.auth.session";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  /** Étape 1 : identifiants. Renvoie l'issue (connecté ou 2FA requis). */
  login: (input: LoginInput) => Promise<LoginResult>;
  /** Étape 2 (2FA) : valide le code et ouvre la session. */
  verifyTwoFa: (tempToken: string, code: string) => Promise<void>;
  /** Active un compte via le lien e-mail (définit le mot de passe) et ouvre la session. */
  activateAccount: (token: string, password: string) => Promise<void>;
  /** Active une app d'authentification : renvoie secret + URI otpauth. */
  setupTwoFa: (tempToken: string) => Promise<TwoFaSetup>;
  /** Demande un e-mail de réinitialisation du mot de passe. */
  requestPasswordReset: (email: string) => Promise<string>;
  /** Confirme la réinitialisation avec le jeton reçu par e-mail. */
  confirmPasswordReset: (token: string, newPassword: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session.user?.id || !session.user.role) return null;
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(() => {
    const stored = readStoredSession();
    // Le token doit être posé avant le premier rendu pour les requêtes initiales.
    setAuthToken(stored?.token ?? null);
    return stored;
  });

  const clearSession = React.useCallback(() => {
    setSession(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    queryClient.clear();
  }, []);

  // Intercepteur 401 : session expirée → déconnexion, RequireAuth redirige vers /login.
  React.useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const commitSession = React.useCallback((newSession: AuthSession) => {
    setAuthToken(newSession.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const login = React.useCallback(
    async (input: LoginInput) => {
      const result = await authAdapter.login(input);
      if (result.status === "authenticated") {
        commitSession(result.session);
      }
      return result;
    },
    [commitSession],
  );

  const verifyTwoFa = React.useCallback(
    async (tempToken: string, code: string) => {
      const newSession = await authAdapter.verifyTwoFa(tempToken, code);
      commitSession(newSession);
    },
    [commitSession],
  );

  const activateAccount = React.useCallback(
    async (token: string, password: string) => {
      const newSession = await authAdapter.activateAccount(token, password);
      commitSession(newSession);
    },
    [commitSession],
  );

  const setupTwoFa = React.useCallback(
    (tempToken: string) => authAdapter.setupTwoFa(tempToken),
    [],
  );

  const requestPasswordReset = React.useCallback(
    (email: string) => authAdapter.requestPasswordReset(email),
    [],
  );

  const confirmPasswordReset = React.useCallback(
    (token: string, newPassword: string) => authAdapter.confirmPasswordReset(token, newPassword),
    [],
  );

  const logout = React.useCallback(async () => {
    await authAdapter.logout();
    clearSession();
  }, [clearSession]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login,
      verifyTwoFa,
      activateAccount,
      setupTwoFa,
      requestPasswordReset,
      confirmPasswordReset,
      logout,
    }),
    [
      session,
      login,
      verifyTwoFa,
      activateAccount,
      setupTwoFa,
      requestPasswordReset,
      confirmPasswordReset,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return context;
}

/** Utilisateur connecté — à utiliser dans les pages protégées (jamais null derrière RequireAuth). */
export function useCurrentUser() {
  const { session } = useAuth();
  if (!session) throw new Error("useCurrentUser appelé hors d'une route protégée");
  return session.user;
}
