import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { UserCreate, UserRole, UserUpdate } from "@/api/types";

const LIST_LIMIT = 500;

export const userKeys = {
  all: ["users"] as const,
  list: (role?: UserRole) => [...userKeys.all, "list", role ?? "all"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
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

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    enabled: userId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/users/{user_id}", { params: { path: { user_id: userId } } }),
      ),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserCreate) => unwrap(await api.POST("/users/", { body })),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(`Compte ${user.email} créé.`);
    },
  });
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserUpdate) =>
      unwrap(
        await api.PUT("/users/{user_id}", {
          params: { path: { user_id: userId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("Compte mis à jour.");
    },
  });
}

/** Active ou désactive un compte (la désactivation coupe l'accès sans rien supprimer). */
export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) =>
      unwrap(
        active
          ? await api.POST("/users/{user_id}/activate", {
              params: { path: { user_id: userId } },
            })
          : await api.POST("/users/{user_id}/deactivate", {
              params: { path: { user_id: userId } },
            }),
      ),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(user.is_active ? "Compte réactivé." : "Compte désactivé.");
    },
  });
}
