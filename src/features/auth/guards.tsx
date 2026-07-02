import { ShieldAlert } from "lucide-react";
import type * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@/api/types";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "./auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

interface RequireRoleProps {
  allow: readonly UserRole[];
  children: React.ReactNode;
}

/** Restreint une route aux rôles autorisés ; affiche un écran 403 sinon. */
export function RequireRole({ allow, children }: RequireRoleProps) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!allow.includes(session.user.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Accès refusé"
        description="Votre rôle ne permet pas d'accéder à cette page."
        className="mt-12"
      />
    );
  }
  return <>{children}</>;
}
