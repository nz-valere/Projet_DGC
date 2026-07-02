import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { UserRole } from "@/api/types";

const LIST_LIMIT = 500;

export const userKeys = {
  all: ["users"] as const,
  list: (role?: UserRole) => [...userKeys.all, "list", role ?? "all"] as const,
};

/** Liste les comptes, filtrable par rôle (ex. ENSEIGNANT pour les séances). */
export function useUsers(role?: UserRole) {
  return useQuery({
    queryKey: userKeys.list(role),
    queryFn: async () =>
      unwrap(
        await api.GET("/users/", { params: { query: { limit: LIST_LIMIT, role } } }),
      ),
  });
}
