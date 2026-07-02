import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, unwrap } from "@/api/client";
import type { MatiereCreate, MatiereEnseignants, MatiereUpdate } from "@/api/types";

const LIST_LIMIT = 500;

export const matiereKeys = {
  all: ["matieres"] as const,
  list: () => [...matiereKeys.all, "list"] as const,
  detail: (id: string) => [...matiereKeys.all, "detail", id] as const,
};

export function useMatieres() {
  return useQuery({
    queryKey: matiereKeys.list(),
    queryFn: async () =>
      unwrap(await api.GET("/matieres/", { params: { query: { limit: LIST_LIMIT } } })),
  });
}

export function useMatiere(matiereId: string) {
  return useQuery({
    queryKey: matiereKeys.detail(matiereId),
    enabled: matiereId !== "",
    queryFn: async () =>
      unwrap(
        await api.GET("/matieres/{matiere_id}", {
          params: { path: { matiere_id: matiereId } },
        }),
      ),
  });
}

export function useCreateMatiere() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: MatiereCreate) => unwrap(await api.POST("/matieres/", { body })),
    onSuccess: (matiere) => {
      void queryClient.invalidateQueries({ queryKey: matiereKeys.all });
      toast.success(`Matière « ${matiere.nom} » créée.`);
    },
  });
}

export function useUpdateMatiere(matiereId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: MatiereUpdate) =>
      unwrap(
        await api.PUT("/matieres/{matiere_id}", {
          params: { path: { matiere_id: matiereId } },
          body,
        }),
      ),
    onSuccess: (matiere) => {
      void queryClient.invalidateQueries({ queryKey: matiereKeys.all });
      toast.success(`Matière « ${matiere.nom} » mise à jour.`);
    },
  });
}

export function useSetMatiereEnseignants(matiereId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: MatiereEnseignants) =>
      unwrap(
        await api.PUT("/matieres/{matiere_id}/enseignants", {
          params: { path: { matiere_id: matiereId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matiereKeys.all });
      toast.success("Enseignants de la matière mis à jour.");
    },
  });
}
